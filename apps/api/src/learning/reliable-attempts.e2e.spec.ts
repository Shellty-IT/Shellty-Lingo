import { createHash, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaService } from "../core/prisma.service";
import { PracticeService } from "./practice.service";
import {
  learningCohort,
  LEARNING_EXPERIMENT_VERSION,
} from "../release/learning-evidence";
import { ReviewService } from "./review.service";
import { LessonSessionService } from "./lesson-session.service";

const databaseUrl = process.env.STAGE1_TEST_DATABASE_URL;

describe.skipIf(!databaseUrl)("reliable attempts on PostgreSQL", () => {
  let prisma: PrismaService;
  let userId: string;
  let userCourseId: string;
  let courseId: string;
  let lessonId: string;
  let revisionId: string;
  let exerciseId: string;
  const fingerprint = createHash("sha256").update(randomUUID()).digest("hex");
  const events = vi.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    // These integration tests must never use the project's ordinary database.
    expect(["localhost", "127.0.0.1"]).toContain(url.hostname);
    expect(url.pathname).toBe("/shellty_stage1_test");
    prisma = new PrismaService({ DATABASE_URL: databaseUrl } as never);
    const user = await prisma.user.create({
      data: {
        email: `stage1-${randomUUID()}@example.test`,
        passwordHash: "not-a-real-password",
      },
    });
    userId = user.id;
    const participation = await prisma.userCourse.create({
      data: {
        userId,
        language: "en",
        learningGoal: "work",
        currentLevel: "A1",
      },
    });
    userCourseId = participation.id;
    const course = await prisma.course.create({
      data: {
        slug: `stage1-${randomUUID()}`,
        language: "en",
        level: "A1",
        title: "Integration fixture",
        status: "published",
      },
    });
    courseId = course.id;
    const module = await prisma.courseModule.create({
      data: {
        courseId,
        slug: "module",
        title: "Module",
        position: 1,
        status: "published",
      },
    });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: module.id,
        slug: "lesson",
        position: 1,
        status: "published",
      },
    });
    lessonId = lesson.id;
    const revision = await prisma.contentRevision.create({
      data: {
        lessonId,
        version: 1,
        title: "Lesson",
        estimatedMinutes: 1,
        status: "published",
      },
    });
    revisionId = revision.id;
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { publishedRevisionId: revisionId },
    });
    await prisma.exerciseIdentity.create({
      data: { fingerprint, level: "A1" },
    });
    const exercise = await prisma.exercise.create({
      data: {
        revisionId,
        contentFingerprint: fingerprint,
        level: "A1",
        position: 1,
        type: "single_choice",
        prompt: "Choose",
        options: [
          { id: "a", text: "Yes" },
          { id: "b", text: "No" },
        ],
        answer: { correct: "a" },
      },
    });
    exerciseId = exercise.id;
  }, 30000);

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } });
    if (courseId) await prisma.course.delete({ where: { id: courseId } });
    if (prisma) {
      await prisma.exerciseIdentity.deleteMany({ where: { fingerprint } });
      await prisma.$disconnect();
    }
  });

  const reviewService = () =>
    new ReviewService(prisma, { event: events } as never);
  const newReview = () =>
    prisma.reviewItem.create({
      data: {
        userCourseId,
        level: "A1",
        sourceKey: randomUUID(),
        sourceText: "test",
        dueAt: new Date("2020-01-01"),
      },
    });

  it("records again then good as two occurrences, even though repetitions resets", async () => {
    const item = await newReview();
    const service = reviewService();
    await service.review(userId, item.id, {
      rating: "again",
      idempotencyKey: "again:0",
      expectedScheduleRevision: 0,
    });
    const first = await prisma.reviewItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(first.repetitions).toBe(0);
    expect(first.scheduleRevision).toBe(1);
    await prisma.reviewItem.update({
      where: { id: item.id },
      data: { dueAt: new Date("2020-01-01") },
    });
    await service.review(userId, item.id, {
      rating: "good",
      idempotencyKey: "good:1",
      expectedScheduleRevision: 1,
    });
    expect(
      await prisma.reviewAttempt.count({ where: { reviewItemId: item.id } }),
    ).toBe(2);
    expect(
      (await prisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } }))
        .scheduleRevision,
    ).toBe(2);
  });

  it("records hard then hard as separate occurrences", async () => {
    const item = await newReview();
    const service = reviewService();
    for (const revision of [0, 1]) {
      await prisma.reviewItem.update({
        where: { id: item.id },
        data: { dueAt: new Date("2020-01-01") },
      });
      await service.review(userId, item.id, {
        rating: "hard",
        idempotencyKey: `hard:${revision}`,
        expectedScheduleRevision: revision,
      });
    }
    const saved = await prisma.reviewItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(saved.repetitions).toBe(0);
    expect(saved.scheduleRevision).toBe(2);
    expect(
      await prisma.reviewAttempt.count({ where: { reviewItemId: item.id } }),
    ).toBe(2);
  });

  it("replays a committed review after its response was lost", async () => {
    const item = await newReview();
    const input = {
      rating: "good",
      idempotencyKey: "lost:response",
      expectedScheduleRevision: 0,
    };
    const original = await reviewService().review(userId, item.id, input);
    const retry = await reviewService().review(userId, item.id, input);
    expect(retry).toEqual({ ...original, alreadyRecorded: true });
    expect(
      await prisma.reviewAttempt.count({ where: { reviewItemId: item.id } }),
    ).toBe(1);
  });

  it("rejects a changed rating under an already committed request key", async () => {
    const item = await newReview();
    await reviewService().review(userId, item.id, {
      rating: "again",
      idempotencyKey: "changed:payload",
      expectedScheduleRevision: 0,
    });
    await expect(
      reviewService().review(userId, item.id, {
        rating: "good",
        idempotencyKey: "changed:payload",
        expectedScheduleRevision: 0,
      }),
    ).rejects.toMatchObject({ response: { code: "IDEMPOTENCY_KEY_REUSED" } });
  });

  it("accepts parallel identical retries exactly once", async () => {
    const item = await newReview();
    const input = {
      rating: "good",
      idempotencyKey: "parallel:same",
      expectedScheduleRevision: 0,
    };
    const outcomes = await Promise.all([
      reviewService().review(userId, item.id, input),
      reviewService().review(userId, item.id, input),
    ]);
    expect(outcomes.filter((outcome) => !outcome.alreadyRecorded)).toHaveLength(
      1,
    );
    expect(
      await prisma.reviewAttempt.count({ where: { reviewItemId: item.id } }),
    ).toBe(1);
  });

  it("allows only one device to claim the same occurrence", async () => {
    const item = await newReview();
    const outcomes = await Promise.allSettled(
      ["device:one", "device:two"].map((idempotencyKey) =>
        reviewService().review(userId, item.id, {
          rating: "good",
          idempotencyKey,
          expectedScheduleRevision: 0,
        }),
      ),
    );
    expect(
      outcomes.filter((outcome) => outcome.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      outcomes.filter((outcome) => outcome.status === "rejected"),
    ).toHaveLength(1);
    expect(
      await prisma.reviewAttempt.count({ where: { reviewItemId: item.id } }),
    ).toBe(1);
  });

  it("does not reinterpret an old request key as a new occurrence", async () => {
    const item = await newReview();
    await reviewService().review(userId, item.id, {
      rating: "good",
      idempotencyKey: "same:key",
      expectedScheduleRevision: 0,
    });
    await prisma.reviewItem.update({
      where: { id: item.id },
      data: { dueAt: new Date("2020-01-01") },
    });
    await expect(
      reviewService().review(userId, item.id, {
        rating: "good",
        idempotencyKey: "same:key",
        expectedScheduleRevision: 1,
      }),
    ).rejects.toMatchObject({ response: { code: "IDEMPOTENCY_KEY_REUSED" } });
  });

  it("rejects stale devices even after the next due date", async () => {
    const item = await newReview();
    await reviewService().review(userId, item.id, {
      rating: "good",
      idempotencyKey: "first:device",
      expectedScheduleRevision: 0,
    });
    await prisma.reviewItem.update({
      where: { id: item.id },
      data: { dueAt: new Date("2020-01-01") },
    });
    await expect(
      reviewService().review(userId, item.id, {
        rating: "easy",
        idempotencyKey: "stale:device",
        expectedScheduleRevision: 0,
      }),
    ).rejects.toMatchObject({ response: { code: "REVIEW_ALREADY_UPDATED" } });
  });

  it("records a parallel lesson retry and completion once", async () => {
    const session = await prisma.learningSession.create({
      data: {
        userCourseId,
        lessonId,
        contentRevisionId: revisionId,
        kind: "lesson",
        idempotencyKey: randomUUID(),
        currentExerciseId: exerciseId,
      },
    });
    await prisma.lessonProgress.upsert({
      where: { userCourseId_lessonId: { userCourseId, lessonId } },
      create: { userCourseId, lessonId },
      update: {},
    });
    const service = new LessonSessionService(
      prisma,
      { event: events } as never,
      {} as never,
      {} as never,
    );
    const input = {
      exerciseId,
      answer: "a",
      idempotencyKey: "parallel:answer",
    };
    const outcomes = await Promise.all([
      service.answer(userId, session.id, input),
      service.answer(userId, session.id, input),
    ]);
    expect(outcomes.filter((outcome) => !outcome.alreadyRecorded)).toHaveLength(
      1,
    );
    expect(
      await prisma.exerciseAttempt.count({ where: { sessionId: session.id } }),
    ).toBe(1);
    expect(
      (
        await prisma.learningSession.findUniqueOrThrow({
          where: { id: session.id },
        })
      ).totalCount,
    ).toBe(1);
    const complete = await Promise.all([
      service.completeLesson(userId, session.id),
      service.completeLesson(userId, session.id),
    ]);
    expect(complete[0]?.score).toBe(1);
    expect(
      (
        await prisma.lessonProgress.findUniqueOrThrow({
          where: { userCourseId_lessonId: { userCourseId, lessonId } },
        })
      ).attempts,
    ).toBe(1);
    await expect(
      service.answer(userId, session.id, { ...input, answer: "b" }),
    ).rejects.toMatchObject({ response: { code: "IDEMPOTENCY_KEY_REUSED" } });
  });
  it("stores one correction across parallel requests without touching the original", async () => {
    const session = await prisma.learningSession.create({
      data: {
        userCourseId,
        lessonId,
        contentRevisionId: revisionId,
        kind: "lesson",
        idempotencyKey: randomUUID(),
      },
    });
    const task = await prisma.exercise.create({
      data: {
        revisionId,
        contentFingerprint: fingerprint,
        level: "A1",
        position: 2,
        type: "gap_fill",
        prompt: "We ___ at four.",
        answer: { accepted: ["meet"] },
        skillKey: "pilot-v1.en.a1.fixture", // gitleaks:allow -- Public curriculum identifier.
        learningObjective: "Arrange a meeting",
        interaction: {
          kind: "correct_fragment",
          before: "We ",
          fragment: "meets",
          after: " at four.",
        },
      },
    });
    try {
      const original = await prisma.exerciseAttempt.create({
        data: {
          sessionId: session.id,
          exerciseId: task.id,
          idempotencyKey: randomUUID(),
          answer: "meets",
          requestHash: createHash("sha256")
            .update("fixture:meets")
            .digest("hex"),
          correct: false,
          score: 0,
          feedback: {},
        },
      });
      const service = new PracticeService(prisma);
      const input = { answer: "meet", idempotencyKey: "correction:race" };
      const outcomes = await Promise.all([
        service.correct(userId, original.id, input),
        service.correct(userId, original.id, input),
      ]);
      expect(outcomes.filter((result) => !result.alreadyRecorded)).toHaveLength(
        1,
      );
      expect(
        await prisma.exerciseCorrection.count({
          where: { originalAttemptId: original.id },
        }),
      ).toBe(1);
      expect(
        await prisma.exerciseAttempt.findUniqueOrThrow({
          where: { id: original.id },
        }),
      ).toEqual(original);
      expect(
        (
          await prisma.learningSession.findUniqueOrThrow({
            where: { id: session.id },
          })
        ).totalCount,
      ).toBe(0);
      expect(await service.saved(userId, original.id)).toMatchObject({
        alreadyRecorded: true,
        assisted: true,
        attemptOrdinal: 2,
      });
      await expect(
        service.correct(userId, original.id, { ...input, answer: "met" }),
      ).rejects.toMatchObject({ response: { code: "IDEMPOTENCY_KEY_REUSED" } });
    } finally {
      await prisma.learningSession.delete({ where: { id: session.id } });
      await prisma.exercise.delete({ where: { id: task.id } });
    }
  });
  it("allocates a course cohort only once under concurrency", async () => {
    const data = {
      learningExperimentVersion: LEARNING_EXPERIMENT_VERSION,
      learningExperimentCohort: learningCohort(userCourseId),
    };
    const outcomes = await Promise.all([
      prisma.userCourse.updateMany({
        where: { id: userCourseId, learningExperimentVersion: null },
        data,
      }),
      prisma.userCourse.updateMany({
        where: { id: userCourseId, learningExperimentVersion: null },
        data,
      }),
    ]);
    expect(outcomes.reduce((sum, outcome) => sum + outcome.count, 0)).toBe(1);
    expect(
      await prisma.userCourse.findUniqueOrThrow({
        where: { id: userCourseId },
      }),
    ).toMatchObject(data);
  });
});
