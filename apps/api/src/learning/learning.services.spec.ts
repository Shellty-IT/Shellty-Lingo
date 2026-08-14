import { createHash } from "node:crypto";

import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { LearningContext } from "./learning-support";
import { LessonSessionService } from "./lesson-session.service";
import { PlacementService } from "./placement.service";
import { ReviewService } from "./review.service";

const context = (prisma: unknown): LearningContext =>
  new LearningContext(prisma as never, { log: vi.fn() } as never);

describe("learning services idempotency", () => {
  it("returns a Polish task explanation and a separate English prompt", async () => {
    const revision = {
      id: "revision-1",
      status: "published",
      title: "Ordering politely",
      summary: "Use a polite request.",
      estimatedMinutes: 10,
      exercises: [
        {
          id: "exercise-1",
          type: "single_choice",
          prompt: "Which request is polite?",
          instructions: null,
          options: [
            { id: "a", text: "Could I have the menu, please?" },
            { id: "b", text: "Give me menu." },
          ],
          mediaAssetId: null,
          position: 1,
        },
        {
          id: "exercise-2",
          type: "matching",
          prompt: "Match each word with its meaning.",
          instructions: null,
          options: [
            { id: "coffee", text: "coffee" },
            { id: "water", text: "water" },
            { id: "kawa", text: "kawa" },
            { id: "woda", text: "woda" },
          ],
          answer: { pairs: { coffee: "kawa", water: "woda" } },
          mediaAssetId: null,
          position: 2,
        },
      ],
    };
    const prisma = {
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: "lesson-1",
          slug: "polite-requests",
          premium: false,
          module: {
            course: {
              id: "course-1",
              slug: "english-a1",
              language: "en",
              level: "A1",
              category: "general",
            },
          },
          publishedRevision: revision,
        }),
      },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "session-1",
          attempts: [],
        }),
      },
      lessonProgress: { upsert: vi.fn() },
      translation: {
        findMany: vi.fn().mockResolvedValue([
          {
            entityType: "lesson_revision",
            entityId: "revision-1",
            locale: "pl",
            field: "title",
            value: "Uprzejme zamawianie",
          },
          {
            entityType: "exercise",
            entityId: "exercise-1",
            locale: "pl",
            field: "prompt",
            value: "Która prośba jest uprzejma?",
          },
          {
            entityType: "exercise",
            entityId: "exercise-1",
            locale: "en",
            field: "prompt",
            value: "Which request is polite?",
          },
        ]),
      },
    };
    const learningContext = {
      userCourse: vi
        .fn()
        .mockResolvedValue({ id: "user-course-1", currentLevel: "A1" }),
      event: vi.fn(),
    };
    const service = new LessonSessionService(
      prisma as never,
      learningContext as never,
      {} as never,
      {} as never,
    );

    const result = await service.startLesson(
      "user-1",
      "english-a1",
      "polite-requests",
      { interfaceLocale: "pl", idempotencyKey: "lesson:start:1" },
    );

    expect(result.lesson.title).toBe("Uprzejme zamawianie");
    expect(result.exercises[0]).toMatchObject({
      promptTranslation: "Która prośba jest uprzejma?",
      prompt: "Which request is polite?",
    });
    expect(result.exercises[1]).toMatchObject({
      matching: {
        left: [
          { id: "coffee", text: "coffee" },
          { id: "water", text: "water" },
        ],
      },
    });
    expect(result.exercises[1]).not.toHaveProperty("options");
    expect(JSON.stringify(result.exercises[1])).not.toContain('"pairs"');
  });

  it("resumes a placement session instead of creating a duplicate", async () => {
    const prisma = {
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({
          id: "course-user-1",
          userId: "user-1",
          language: "en",
        }),
      },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          kind: "placement",
        }),
        create: vi.fn(),
      },
    };
    const service = new PlacementService(prisma as never, context(prisma));

    const result = await service.startPlacement("user-1", {
      language: "en",
      idempotencyKey: "placement:onboarding",
    });

    expect(result).toMatchObject({ sessionId: "session-1", resumed: true });
    expect(prisma.learningSession.create).not.toHaveBeenCalled();
  });

  it("does not resume a C1 exam through the placement endpoint", async () => {
    const prisma = {
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({
          id: "course-user-1",
          userId: "user-1",
          language: "en",
        }),
      },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "exam-1",
          kind: "placement",
          result: { examKind: "c1" },
        }),
        create: vi.fn(),
      },
    };
    const service = new PlacementService(prisma as never, context(prisma));

    await expect(
      service.startPlacement("user-1", {
        language: "en",
        idempotencyKey: "shared:attempt:key",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.learningSession.create).not.toHaveBeenCalled();
  });

  it("does not submit a C1 exam through the placement endpoint", async () => {
    const transaction = vi.fn();
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "exam-1",
          kind: "placement",
          status: "active",
          result: { examKind: "c1" },
          userCourse: {
            userId: "user-1",
            language: "en",
            currentLevel: "B2",
          },
        }),
      },
      $transaction: transaction,
    };
    const service = new PlacementService(prisma as never, context(prisma));

    await expect(
      service.submitPlacement("user-1", "exam-1", { answers: [] }),
    ).rejects.toMatchObject({
      response: { code: "PLACEMENT_SESSION_NOT_FOUND" },
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("resumes the active lesson instead of resetting its progress", async () => {
    const revision = {
      id: "revision-1",
      title: "Lesson",
      summary: null,
      estimatedMinutes: 10,
      exercises: [],
    };
    const lesson = {
      id: "lesson-1",
      slug: "polite-requests",
      premium: false,
      module: {
        slug: "foundation",
        course: {
          id: "course-1",
          slug: "english-a1",
          language: "en",
          level: "A1",
          category: "general",
        },
      },
      publishedRevision: { ...revision, status: "published" },
    };
    const prisma = {
      lesson: { findFirst: vi.fn().mockResolvedValue(lesson) },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({
          id: "active-session",
          attempts: [],
          contentRevision: revision,
        }),
        create: vi.fn(),
      },
      translation: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const learningContext = {
      userCourse: vi
        .fn()
        .mockResolvedValue({ id: "user-course-1", currentLevel: "A1" }),
    };
    const service = new LessonSessionService(
      prisma as never,
      learningContext as never,
      {} as never,
      {} as never,
    );

    const result = await service.startLesson(
      "user-1",
      "english-a1",
      "polite-requests",
      { interfaceLocale: "en", idempotencyKey: "lesson:new-intent" },
    );

    expect(result).toMatchObject({
      sessionId: "active-session",
      resumed: true,
    });
    expect(prisma.learningSession.create).not.toHaveBeenCalled();
  });

  it("does not allow a learner to bypass lesson level gating", async () => {
    const prisma = {
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: "lesson-b2",
          slug: "negotiation-b2",
          premium: false,
          module: {
            slug: "b2-professional-english",
            course: {
              id: "course-b2",
              slug: "english-general-b2",
              language: "en",
              level: "B2",
              category: "general",
            },
          },
          publishedRevision: { id: "revision-b2", status: "published" },
        }),
      },
      learningSession: { findUnique: vi.fn(), findFirst: vi.fn() },
    };
    const learningContext = {
      userCourse: vi
        .fn()
        .mockResolvedValue({ id: "user-course-1", currentLevel: "A1" }),
    };
    const service = new LessonSessionService(
      prisma as never,
      learningContext as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.startLesson("user-1", "english-general-b2", "negotiation-b2", {
        interfaceLocale: "en",
        idempotencyKey: "lesson:bypass",
      }),
    ).rejects.toMatchObject({ response: { code: "LESSON_NOT_AVAILABLE" } });
    expect(prisma.learningSession.findUnique).not.toHaveBeenCalled();
  });

  it("returns a recorded exercise attempt for a retried request", async () => {
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          kind: "lesson",
          status: "active",
          userCourse: { userId: "user-1" },
          lesson: { id: "lesson-1" },
          contentRevision: { exercises: [] },
        }),
      },
      exerciseAttempt: {
        findUnique: vi.fn().mockResolvedValue({
          id: "attempt-1",
          exerciseId: "exercise-1",
          requestHash: createHash("sha256")
            .update(JSON.stringify("a"))
            .digest("hex"),
          correct: true,
          score: 1,
          feedback: { explanation: "Correct." },
        }),
        create: vi.fn(),
      },
    };
    const service = new LessonSessionService(
      prisma as never,
      context(prisma),
      {} as never,
      {} as never,
    );

    const result = await service.answer("user-1", "session-1", {
      exerciseId: "exercise-1",
      answer: "a",
      idempotencyKey: "answer:exercise-1:1",
    });

    expect(result.alreadyRecorded).toBe(true);
    expect(prisma.exerciseAttempt.create).not.toHaveBeenCalled();
  });

  it("returns Polish feedback with quoted English phrases", async () => {
    const exercise = {
      id: "exercise-1",
      type: "single_choice",
      prompt: 'What does "Certainly, one moment" mean?',
      options: [
        { id: "a", text: "They will bring it soon." },
        { id: "b", text: "They refuse to bring it." },
      ],
      answer: { correct: "a" },
      explanation: '"Certainly" confirms agreement.',
    };
    const transaction = {
      exerciseAttempt: {
        create: vi.fn().mockResolvedValue({ id: "attempt-1" }),
      },
      learningSession: { update: vi.fn() },
      lessonProgress: { update: vi.fn() },
      reviewItem: { upsert: vi.fn() },
    };
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          kind: "lesson",
          status: "active",
          currentExerciseId: "exercise-1",
          result: { interfaceLocale: "pl" },
          userCourseId: "user-course-1",
          userCourse: { userId: "user-1" },
          lesson: { id: "lesson-1" },
          contentRevision: {
            title: "At a restaurant",
            exercises: [exercise],
          },
        }),
      },
      exerciseAttempt: { findUnique: vi.fn().mockResolvedValue(null) },
      translation: {
        findUnique: vi.fn().mockResolvedValue({
          value:
            '"Certainly" potwierdza zgodę, a "one moment" oznacza "chwileczkę".',
        }),
      },
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const learningContext = { event: vi.fn() };
    const service = new LessonSessionService(
      prisma as never,
      learningContext as never,
      {} as never,
      {} as never,
    );

    const result = await service.answer("user-1", "session-1", {
      exerciseId: "exercise-1",
      answer: "a",
      idempotencyKey: "answer:exercise-1:feedback",
    });

    expect(result.feedback.explanation).toBe(
      '"Certainly" potwierdza zgodę, a "one moment" oznacza "chwileczkę".',
    );
  });

  it("rejects a reused attempt key when the answer changed", async () => {
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          kind: "lesson",
          status: "active",
          userCourse: { userId: "user-1" },
          lesson: { id: "lesson-1" },
          contentRevision: { exercises: [] },
        }),
      },
      exerciseAttempt: {
        findUnique: vi.fn().mockResolvedValue({
          id: "attempt-1",
          exerciseId: "exercise-1",
          requestHash: createHash("sha256")
            .update(JSON.stringify("a"))
            .digest("hex"),
          correct: true,
          score: 1,
          feedback: {},
        }),
      },
    };
    const service = new LessonSessionService(
      prisma as never,
      context(prisma),
      {} as never,
      {} as never,
    );

    await expect(
      service.answer("user-1", "session-1", {
        exerciseId: "exercise-1",
        answer: "b",
        idempotencyKey: "answer:exercise-1:1",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("does not accept an exercise out of session order", async () => {
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          kind: "lesson",
          status: "active",
          currentExerciseId: "exercise-1",
          userCourse: { userId: "user-1" },
          lesson: { id: "lesson-1" },
          contentRevision: {
            exercises: [{ id: "exercise-2" }],
          },
        }),
      },
      exerciseAttempt: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const service = new LessonSessionService(
      prisma as never,
      context(prisma),
      {} as never,
      {} as never,
    );

    await expect(
      service.answer("user-1", "session-1", {
        exerciseId: "exercise-2",
        answer: "a",
        idempotencyKey: "answer:exercise-2:1",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("uses an optimistic claim to prevent two ratings of one review", async () => {
    const item = {
      id: "review-1",
      userCourseId: "course-1",
      dueAt: new Date("2026-07-15T08:00:00Z"),
      intervalMinutes: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      algorithmVersion: "srs-v1",
      userCourse: { userId: "user-1" },
    };
    const transaction = {
      reviewItem: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      reviewAttempt: { create: vi.fn() },
    };
    const prisma = {
      reviewItem: { findUnique: vi.fn().mockResolvedValue(item) },
      reviewAttempt: { findUnique: vi.fn().mockResolvedValue(null) },
      $transaction: vi.fn((callback: (value: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new ReviewService(prisma as never, context(prisma));

    await expect(
      service.review("user-1", item.id, {
        rating: "good",
        idempotencyKey: "review:1",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(transaction.reviewAttempt.create).not.toHaveBeenCalled();
  });
});

describe("placement retake gating", () => {
  const dashboardPrisma = (lessonsCompletedSincePlacement: number) => ({
    userCourse: {
      findUnique: vi.fn().mockResolvedValue({
        id: "course-user-1",
        currentLevel: "A2",
        placementCompletedAt: new Date("2026-01-01T00:00:00Z"),
      }),
    },
    reviewItem: { count: vi.fn().mockResolvedValue(0) },
    lessonProgress: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(lessonsCompletedSincePlacement),
    },
  });
  const courseStructure = { get: vi.fn().mockResolvedValue([]) };

  it("keeps the placement badge hidden below the retake threshold", async () => {
    const prisma = dashboardPrisma(3);
    const service = new LessonSessionService(
      prisma as never,
      context(prisma),
      {} as never,
      courseStructure as never,
    );

    const dashboard = await service.dashboard("user-1", "en");

    expect(dashboard.placementCompleted).toBe(true);
  });

  it("re-shows the placement badge after 10 lessons completed since the last placement", async () => {
    const prisma = dashboardPrisma(10);
    const service = new LessonSessionService(
      prisma as never,
      context(prisma),
      {} as never,
      courseStructure as never,
    );

    const dashboard = await service.dashboard("user-1", "en");

    expect(dashboard.placementCompleted).toBe(false);
  });
});
