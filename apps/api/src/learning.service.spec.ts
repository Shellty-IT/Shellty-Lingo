import { describe, expect, it, vi } from "vitest";

import { LearningService } from "./learning.service";

describe("LearningService idempotency", () => {
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
    const service = new LearningService(prisma as never, {} as never);

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
          lesson: {
            publishedRevision: { exercises: [] },
          },
        }),
      },
      exerciseAttempt: {
        findUnique: vi.fn().mockResolvedValue({
          id: "attempt-1",
          exerciseId: "exercise-1",
          correct: true,
          score: 1,
          feedback: { explanation: "Correct." },
        }),
        create: vi.fn(),
      },
    };
    const service = new LearningService(prisma as never, {} as never);

    const result = await service.answer("user-1", "session-1", {
      exerciseId: "exercise-1",
      answer: "a",
      idempotencyKey: "answer:exercise-1:1",
    });

    expect(result.alreadyRecorded).toBe(true);
    expect(prisma.exerciseAttempt.create).not.toHaveBeenCalled();
  });
});
