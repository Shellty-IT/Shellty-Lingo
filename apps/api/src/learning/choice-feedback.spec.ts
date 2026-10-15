import { describe, expect, it, vi } from "vitest";
import { choiceTeaching } from "../content/choice-explanations";
import { LessonSessionService } from "./lesson-session.service";

describe("multiple-choice teaching after assessment", () => {
  it.each([
    { answer: ["a", "b"], correct: true },
    { answer: ["a"], correct: false },
    { answer: ["c", "d"], correct: false },
    { answer: ["a", "b", "c", "d"], correct: false },
  ])("returns all explanations for $answer", async ({ answer, correct }) => {
    const exercise = {
      id: "exercise-1",
      type: "multiple_choice",
      level: "B2",
      prompt: "Choose two correct conditionals.",
      options: choiceTeaching[1]!.choices.map((choice, index) => ({
        id: String.fromCharCode(97 + index),
        text: choice.text,
      })),
      answer: { correct: ["a", "b"] },
      explanation: "Both selected expressions are natural in this situation.",
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
      exerciseTutorHint: { findUnique: vi.fn().mockResolvedValue(null) },
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          kind: "lesson",
          status: "active",
          currentExerciseId: exercise.id,
          result: { interfaceLocale: "pl" },
          userCourseId: "course-1",
          userCourse: { userId: "user-1", currentLevel: "B2" },
          lesson: {
            id: "lesson-1",
            module: { course: { level: "B2", language: "en" } },
          },
          contentRevision: { title: "Conditionals", exercises: [exercise] },
        }),
      },
      exerciseAttempt: { findUnique: vi.fn().mockResolvedValue(null) },
      translation: {
        findUnique: vi.fn().mockResolvedValue({
          value: "Oba zaznaczone wyrażenia są naturalne w tej sytuacji.",
        }),
      },
      $transaction: vi.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const service = new LessonSessionService(
      prisma as never,
      { event: vi.fn() } as never,
      {} as never,
      {} as never,
    );
    const result = await service.answer("user-1", "session-1", {
      exerciseId: exercise.id,
      answer,
      idempotencyKey: "choice:test:1",
    });
    expect(result.correct).toBe(correct);
    for (const option of exercise.options)
      expect(result.feedback.explanation).toContain(option.text);
    expect(result.feedback.explanation).toContain(
      "Will moved jest niegramatyczne",
    );
    expect(result.feedback.explanation).toContain("III okres warunkowy");
    expect(transaction.exerciseAttempt.create.mock.calls[0]?.[0]).toMatchObject(
      { data: { feedback: { explanation: result.feedback.explanation } } },
    );
  });

  it("preserves a complete editorial explanation rather than replacing it with catalogue text", async () => {
    const options = choiceTeaching[1]!.choices.map((choice, i) => ({
      id: String(i),
      text: choice.text,
    }));
    const explanation = options
      .map((option) => `${option.text}\nIndependently reviewed teaching text.`)
      .join("\n\n");
    const prisma = {
      translation: {
        findUnique: vi.fn().mockResolvedValue({ value: explanation }),
      },
    };
    const service = new LessonSessionService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const explain = (
      service as unknown as {
        exerciseExplanation(
          locale: string,
          language: string,
          exercise: unknown,
          expected: unknown,
        ): Promise<string>;
      }
    ).exerciseExplanation.bind(service);
    expect(
      await explain(
        "en",
        "en",
        { id: "e", type: "multiple_choice", options, explanation: null },
        ["0", "1"],
      ),
    ).toBe(explanation);
  });
});
