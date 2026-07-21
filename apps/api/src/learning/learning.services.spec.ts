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
