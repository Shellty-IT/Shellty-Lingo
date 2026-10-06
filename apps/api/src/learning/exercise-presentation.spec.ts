import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { LessonSessionService } from "./lesson-session.service";

const exercise = {
  id: "exercise",
  level: "A1",
  type: "multiple_choice",
  position: 1,
  prompt: "Choose greetings",
  instructions: "Choose two greetings.",
  explanation: "Use a greeting.",
  options: [
    { id: "a", text: "Hello" },
    { id: "b", text: "Hi" },
    { id: "c", text: "Bye" },
  ],
  answer: { correct: ["a", "b"] },
  mediaAssetId: null,
};
const revision = {
  id: "revision",
  status: "published",
  title: "Greetings",
  summary: null,
  estimatedMinutes: 1,
  exercises: [exercise],
};
const lesson = {
  id: "lesson",
  slug: "lesson",
  premium: false,
  publishedRevision: revision,
  module: {
    slug: "module",
    course: {
      id: "course",
      slug: "course",
      language: "en",
      level: "A1",
      category: "general",
    },
  },
};

describe("localized task presentation", () => {
  it("hides ordering punctuation and never presents the bank in answer order", async () => {
    const options = [
      { id: "a", text: "Not only did" },
      { id: "b", text: "the team restore the service," },
      { id: "c", text: "but it also documented" },
      { id: "d", text: "the recovery procedure." },
    ];
    const task = {
      ...exercise,
      type: "ordering",
      options,
      answer: { correct: options.map((option) => option.id) },
    };
    const content = { ...revision, exercises: [task] };
    const alignedSessionId = Array.from(
      { length: 512 },
      (_, index) => `session-${index}`,
    ).find((sessionId) => {
      const rank = (id: string) =>
        createHash("sha256")
          .update(`${sessionId}:${task.id}:${id}`)
          .digest()
          .readUInt32BE(0);
      return options
        .map((option) => option.id)
        .sort((left, right) => rank(left) - rank(right))
        .every((id, index) => id === options[index]!.id);
    });
    expect(alignedSessionId).toBeDefined();
    const prisma = {
      lesson: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ ...lesson, publishedRevision: content }),
      },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({
          id: alignedSessionId,
          kind: "lesson",
          result: { interfaceLocale: "pl" },
          attempts: [],
          contentRevision: content,
        }),
      },
      translation: { findMany: vi.fn().mockResolvedValue([]) },
      exerciseTutorHint: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new LessonSessionService(
      prisma as never,
      {
        userCourse: vi
          .fn()
          .mockResolvedValue({ id: "user-course", currentLevel: "A1" }),
      } as never,
      {} as never,
      {} as never,
    );
    const result = await service.startLesson("user", "course", "lesson", {
      idempotencyKey: "ordering:display",
      interfaceLocale: "pl",
    });
    const shown = result.exercises[0]!.options!;
    expect(shown.map((option) => option.id)).not.toEqual(
      options.map((option) => option.id),
    );
    expect(new Map(shown.map((option) => [option.id, option.text]))).toEqual(
      new Map([
        ["a", "Not only did"],
        ["b", "The team restore the service"],
        ["c", "But it also documented"],
        ["d", "The recovery procedure"],
      ]),
    );
    expect(shown).toEqual(
      (
        await service.startLesson("user", "course", "lesson", {
          idempotencyKey: "ordering:display",
          interfaceLocale: "pl",
        })
      ).exercises[0]!.options,
    );
  });
  it.each([
    { locale: "pl", value: "Wybierz dwa powitania." },
    { locale: "en", value: "Choose two greetings." },
    { locale: "th", value: "เลือกคำทักทายสองคำ" },
  ])(
    "preserves verified $locale instructions when resuming in a different UI locale",
    async ({ locale, value }) => {
      const prisma = {
        lesson: { findFirst: vi.fn().mockResolvedValue(lesson) },
        learningSession: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue({
            id: "session",
            kind: "lesson",
            result: { interfaceLocale: locale },
            attempts: [],
            contentRevision: revision,
          }),
        },
        translation: {
          findMany: vi.fn().mockResolvedValue([
            {
              entityType: "exercise",
              entityId: exercise.id,
              locale,
              field: "instructions",
              value,
              verifiedAt: new Date(),
            },
          ]),
        },
        exerciseTutorHint: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const service = new LessonSessionService(
        prisma as never,
        {
          userCourse: vi
            .fn()
            .mockResolvedValue({ id: "user-course", currentLevel: "A1" }),
        } as never,
        {} as never,
        {} as never,
      );
      const result = await service.startLesson("user", "course", "lesson", {
        idempotencyKey: "resume:key",
        interfaceLocale: locale === "en" ? "th" : "en",
      });
      expect(result.interfaceLocale).toBe(locale);
      expect(result.exercises[0]).toMatchObject({
        instructions: value,
        instructionsLocale: locale,
        answerLanguage: "en",
        responseConstraints: { selectionCount: 2 },
      });
      expect(result.exercises[0]).not.toHaveProperty("answer");
    },
  );
  it("keeps the source instruction when a localized translation is unverified", async () => {
    const prisma = {
      lesson: { findFirst: vi.fn().mockResolvedValue(lesson) },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue({
          id: "session",
          result: { interfaceLocale: "pl" },
          attempts: [],
          contentRevision: revision,
        }),
      },
      translation: {
        findMany: vi.fn().mockResolvedValue([
          {
            entityType: "exercise",
            entityId: exercise.id,
            locale: "pl",
            field: "instructions",
            value: "Incorrect draft",
            verifiedAt: null,
          },
        ]),
      },
      exerciseTutorHint: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const service = new LessonSessionService(
      prisma as never,
      {
        userCourse: vi
          .fn()
          .mockResolvedValue({ id: "user-course", currentLevel: "A1" }),
      } as never,
      {} as never,
      {} as never,
    );
    const result = await service.startLesson("user", "course", "lesson", {
      idempotencyKey: "resume:key",
      interfaceLocale: "pl",
    });
    expect(result.exercises[0]).toMatchObject({
      instructions: exercise.instructions,
      instructionsLocale: "en",
    });
  });
  it.each(["reading", "listening"])(
    "records $mode evidence separately",
    async (mode) => {
      const listeningExercise = {
        ...exercise,
        type: "listening",
        answer: { correct: "a" },
      };
      const transaction = {
        exerciseAttempt: {
          create: vi.fn().mockResolvedValue({ id: "attempt" }),
        },
        learningSession: { update: vi.fn() },
        lessonProgress: { update: vi.fn() },
        reviewItem: { upsert: vi.fn() },
      };
      const events = vi.fn();
      const prisma = {
        learningSession: {
          findUnique: vi.fn().mockResolvedValue({
            id: "session",
            kind: "lesson",
            status: "active",
            currentExerciseId: exercise.id,
            userCourseId: "user-course",
            userCourse: { userId: "user", currentLevel: "A1" },
            lesson,
            result: { interfaceLocale: "en" },
            contentRevision: { ...revision, exercises: [listeningExercise] },
          }),
        },
        exerciseAttempt: { findUnique: vi.fn().mockResolvedValue(null) },
        exerciseTutorHint: { findUnique: vi.fn().mockResolvedValue(null) },
        $transaction: vi.fn((callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
        ),
      };
      const service = new LessonSessionService(
        prisma as never,
        { event: events } as never,
        {} as never,
        {} as never,
      );
      const answer = { selected: "a", mode };
      const result = await service.answer("user", "session", {
        exerciseId: exercise.id,
        answer,
        idempotencyKey: "reading:answer",
      });
      expect(result.correct).toBe(true);
      expect(result.feedback).toMatchObject({
        practiceMode: mode,
        listeningVerified: mode === "listening",
      });
      expect(transaction.exerciseAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ answer }) as unknown,
        }),
      );
      expect(events).toHaveBeenCalledWith(
        "user",
        "user-course",
        null,
        "exercise_answered",
        expect.objectContaining({
          practiceMode: mode,
          listeningVerified: mode === "listening",
        }),
      );
    },
  );
  it.each(["control", "pilot"] as const)(
    "keeps the frozen %s task variant on resume",
    async (cohort) => {
      const task = {
        ...exercise,
        type: "gap_fill",
        skillKey: "pilot-v1.en.a2.meeting", // gitleaks:allow -- Public curriculum identifier.
        answer: { accepted: ["meet"] },
        interaction: {
          kind: "correct_fragment",
          before: "We ",
          fragment: "meets",
          after: " at four.",
        },
      };
      const content = { ...revision, exercises: [task] };
      const prisma = {
        lesson: {
          findFirst: vi
            .fn()
            .mockResolvedValue({ ...lesson, publishedRevision: content }),
        },
        learningSession: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue({
            id: "session",
            result: {
              interfaceLocale: "en",
              experiment: { version: "learning-pilot-v1", cohort },
            },
            attempts: [],
            contentRevision: content,
          }),
        },
        translation: { findMany: vi.fn().mockResolvedValue([]) },
        exerciseTutorHint: { findMany: vi.fn().mockResolvedValue([]) },
      };
      const service = new LessonSessionService(
        prisma as never,
        {
          userCourse: vi
            .fn()
            .mockResolvedValue({ id: "course", currentLevel: "A1" }),
        } as never,
        {} as never,
        {} as never,
      );
      const result = await service.startLesson("user", "course", "lesson", {
        idempotencyKey: "resume:key",
      });
      const shown = result.exercises[0]!;
      if (cohort === "control") {
        expect(shown).not.toHaveProperty("interaction");
        expect(shown).not.toHaveProperty("instructions");
        expect(shown.prompt).toBe("We ___ at four.");
      } else expect(shown.interaction).toEqual(task.interaction);
      expect(shown).not.toHaveProperty("answer");
    },
  );
});
