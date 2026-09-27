import { describe, expect, it, vi } from "vitest";
import { LessonSessionService } from "./lesson-session.service";

describe("help at answer submission", () => {
  it.each([
    { status: "ready", updatedAt: new Date("2020-01-01"), assisted: true },
    { status: "pending", updatedAt: new Date("2020-01-01"), assisted: false },
    { status: "ready", updatedAt: new Date("2099-01-01"), assisted: false },
  ])("freezes help status $status at $updatedAt", async (initial) => {
    let hint = { status: initial.status, updatedAt: initial.updatedAt };
    const exercise = {
      id: "exercise",
      type: "typed_answer",
      level: "A1",
      prompt: "Say hello",
      answer: { accepted: ["Hello"] },
      explanation: "Use a greeting.",
    };
    const transaction = {
      exerciseAttempt: { create: vi.fn().mockResolvedValue({ id: "attempt" }) },
      learningSession: { update: vi.fn() },
      lessonProgress: { update: vi.fn() },
      reviewItem: { upsert: vi.fn() },
    };
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session",
          kind: "lesson",
          status: "active",
          currentExerciseId: exercise.id,
          result: { interfaceLocale: "en" },
          userCourseId: "user-course",
          userCourse: { userId: "user", currentLevel: "A1" },
          lesson: {
            id: "lesson",
            module: { course: { language: "en", level: "A1" } },
          },
          contentRevision: { title: "Greetings", exercises: [exercise] },
        }),
      },
      exerciseAttempt: { findUnique: vi.fn().mockResolvedValue(null) },
      exerciseTutorHint: {
        findUnique: vi.fn(() => Promise.resolve({ ...hint })),
      },
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const assessor = {
      assess: vi.fn(() => {
        // A pending hint completes while the submitted answer is being graded.
        hint = { status: "ready", updatedAt: new Date() };
        return Promise.reject(new Error("Use deterministic fallback"));
      }),
    };
    const events = vi.fn();
    const service = new LessonSessionService(
      prisma as never,
      { event: events } as never,
      {} as never,
      {} as never,
      assessor as never,
    );
    const result = await service.answer("user", "session", {
      exerciseId: exercise.id,
      answer: "Hello",
      idempotencyKey: "help:timing",
    });
    expect(result.feedback["assisted"] === true).toBe(initial.assisted);
    expect(events).toHaveBeenCalledWith(
      "user",
      "user-course",
      null,
      "exercise_answered",
      expect.objectContaining({ assisted: initial.assisted }),
    );
    expect(prisma.exerciseTutorHint.findUnique).toHaveBeenCalledOnce();
  });
});
