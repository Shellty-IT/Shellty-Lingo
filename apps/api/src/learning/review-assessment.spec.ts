import { describe, expect, it, vi } from "vitest";

import { ReviewService } from "./review.service";

const review = {
  id: "review-1",
  sourceText: "otherwise",
  answer: {
    mode: "text" as const,
    acceptedAnswers: ["w przeciwnym razie"],
    expectedAnswer: "w przeciwnym razie",
  },
  explanation: "Znaczenie zwrotu.",
  usageTip: "Przykład użycia.",
};

const assessor = {
  assess: vi.fn().mockResolvedValue({
    result: {
      verdict: "correct",
      suggestedAnswer: "w innym przypadku",
      explanation: "To poprawny synonim.",
      usageTip: "Użyj go dla alternatywnej konsekwencji.",
      examples: ["Pierwszy przykład.", "Drugi przykład."],
    },
  }),
};

const service = () => {
  const instance = new ReviewService(
    {} as never,
    { userCourse: vi.fn().mockResolvedValue({ currentLevel: "B1" }) } as never,
    assessor as never,
  );
  vi.spyOn(instance, "reviews").mockResolvedValue([review] as never);
  return instance;
};

describe("review answer assessment", () => {
  it("accepts a synonymous translation and teaches why", async () => {
    const result = await service().assess("user-1", "review-1", {
      answer: "w innym przypadku",
      language: "en",
      interfaceLocale: "pl",
    });
    expect(result).toMatchObject({
      verdict: "correct",
      score: 1,
      explanation: "To poprawny synonim.",
      dynamic: true,
    });
    expect(assessor.assess).toHaveBeenCalledWith(
      expect.objectContaining({
        language: "pl",
        learnerAnswer: "w innym przypadku",
      }),
    );
  });

  it("preserves an exact reference answer even if the model disagrees", async () => {
    assessor.assess.mockResolvedValueOnce({
      result: {
        verdict: "incorrect",
        suggestedAnswer: "w przeciwnym razie",
        explanation: "To poprawne tłumaczenie.",
        usageTip: "Zwróć uwagę na kontekst.",
        examples: ["Przykład jeden.", "Przykład dwa."],
      },
    });
    const result = await service().assess("user-1", "review-1", {
      answer: "w przeciwnym razie",
      language: "en",
      interfaceLocale: "pl",
    });
    expect(result.verdict).toBe("correct");
  });

  it("gives partial credit when the meaning is clear but needs correction", async () => {
    assessor.assess.mockResolvedValueOnce({
      result: {
        verdict: "almost",
        suggestedAnswer: "w przeciwnym razie",
        explanation: "Znaczenie jest jasne, ale forma wymaga poprawy.",
        usageTip: "Zwróć uwagę na przypadek.",
        examples: ["Pierwszy przykład.", "Drugi przykład."],
      },
    });
    const result = await service().assess("user-1", "review-1", {
      answer: "w przeciwny razie",
      language: "en",
      interfaceLocale: "pl",
    });
    expect(result).toMatchObject({ verdict: "almost", score: 0.5 });
  });

  it("uses the reviewed answer if the model fails", async () => {
    assessor.assess.mockRejectedValueOnce(new Error("unavailable"));
    const result = await service().assess("user-1", "review-1", {
      answer: "w przeciwnym razie",
      language: "en",
      interfaceLocale: "pl",
    });
    expect(result).toMatchObject({ verdict: "correct", dynamic: false });
  });
});
