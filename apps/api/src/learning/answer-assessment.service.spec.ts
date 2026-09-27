import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeAnswer } from "@shellty/api-contracts";
import { AnswerAssessmentService } from "./answer-assessment.service";
import { gradeExercise } from "./learning-engine";
const input = {
  exerciseType: "typed_answer" as const,
  answerLanguage: "en" as const,
  interfaceLocale: "pl" as const,
  level: "A2",
  prompt: "Suggest a time.",
  acceptedAnswers: ["Could we meet at four?"],
  learnerAnswer: "Can we meet at four?",
};
describe("versioned shared assessment", () => {
  afterEach(() => vi.useRealTimers());
  it.each([
    ["don't", "dont", false],
    ["don’t", "don't", true],
    ["เข้า", "เขา", false],
    ["Hello!", "hello", true],
    ["C++", "C", false],
    ["U.S.", "US", false],
  ])(
    "preserves meaningful distinctions: %s / %s",
    (reference, submitted, expected) => {
      expect(normalizeAnswer(reference) === normalizeAnswer(submitted)).toBe(
        expected,
      );
      expect(
        gradeExercise("typed_answer", { accepted: [reference] }, submitted)
          .correct,
      ).toBe(expected);
    },
  );
  it("returns an exact answer without requesting a model", async () => {
    const assessor = { assess: vi.fn() };
    expect(
      await new AnswerAssessmentService(assessor as never).assess({
        ...input,
        learnerAnswer: input.acceptedAnswers[0]!,
      }),
    ).toMatchObject({
      correct: true,
      metadata: { source: "reference", policyVersion: "answer-v2" },
    });
    expect(assessor.assess).not.toHaveBeenCalled();
  });
  it("does not reinterpret a closed gap with semantic AI", async () => {
    const assessor = { assess: vi.fn() };
    const result = await new AnswerAssessmentService(assessor as never).assess({
      ...input,
      exerciseType: "gap_fill",
      acceptedAnswers: ["meet"],
      learnerAnswer: "meet.",
    });
    expect(result).toMatchObject({
      correct: false,
      verdict: "incorrect",
      metadata: { rubricVersion: "reference-v1" },
    });
    expect(assessor.assess).not.toHaveBeenCalled();
  });
  it("keeps an unknown open answer neutral when no provider is available", async () => {
    expect(await new AnswerAssessmentService().assess(input)).toMatchObject({
      verdict: "needs_review",
      metadata: { status: "needs_review", source: "unavailable" },
    });
  });
  it("bounds the result deadline and ignores a late provider", async () => {
    vi.useFakeTimers();
    const assessor = { assess: vi.fn(() => new Promise(() => undefined)) };
    const result = new AnswerAssessmentService(assessor as never).assess(input);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await result).toMatchObject({ verdict: "needs_review" });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("records the provider and model for a semantically accepted answer", async () => {
    const assessor = {
      assess: vi.fn().mockResolvedValue({
        servedBy: "test",
        model: "model-v1",
        result: {
          verdict: "correct",
          suggestedAnswer: input.learnerAnswer,
          explanation: "Valid request.",
          usageTip: "Ask politely.",
          examples: ["Could we meet at five?", "Is six possible?"],
          inputTokens: 10,
          outputTokens: 20,
        },
      }),
    };
    expect(
      await new AnswerAssessmentService(assessor as never).assess(input),
    ).toMatchObject({
      correct: true,
      metadata: {
        source: "ai",
        provider: "test",
        model: "model-v1",
        promptVersion: "typed-assessment-v2",
        inputTokens: 10,
      },
    });
  });
});
