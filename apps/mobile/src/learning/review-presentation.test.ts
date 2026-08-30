import { describe, expect, it } from "vitest";

import {
  expectedReviewAnswer,
  reviewAnswerCorrect,
  reviewAnswerReady,
} from "./review-presentation";

describe("review answer presentation", () => {
  it("requires a typed answer for a gap-fill review before revealing feedback", () => {
    const answer = {
      mode: "text" as const,
      acceptedAnswers: ["due"],
      expectedAnswer: "due",
    };

    expect(reviewAnswerReady(answer, "", [])).toBe(false);
    expect(reviewAnswerReady(answer, "due", [])).toBe(true);
    expect(reviewAnswerCorrect(answer, " Due. ", [])).toBe(true);
    expect(reviewAnswerCorrect(answer, "Friday", [])).toBe(false);
    expect(expectedReviewAnswer(answer)).toBe("due");
  });

  it("uses selectable options only when the review contains a choice task", () => {
    const answer = {
      mode: "single_choice" as const,
      options: [
        { id: "a", text: "due" },
        { id: "b", text: "done" },
      ],
      correctOptionIds: ["a"],
    };

    expect(reviewAnswerReady(answer, "", [])).toBe(false);
    expect(reviewAnswerReady(answer, "", ["a"])).toBe(true);
    expect(reviewAnswerCorrect(answer, "", ["a"])).toBe(true);
    expect(reviewAnswerCorrect(answer, "", ["b"])).toBe(false);
    expect(expectedReviewAnswer(answer)).toBe("due");
  });
});
