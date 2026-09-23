import { describe, expect, it } from "vitest";

import {
  expectedReviewAnswer,
  formatReviewInterval,
  reviewAnswerCorrect,
  reviewAnswerReady,
  reviewRatingsForAnswer,
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

  it("uses objective retry after an error and asks about effort after success", () => {
    expect(reviewRatingsForAnswer(false)).toEqual(["again"]);
    expect(reviewRatingsForAnswer(true)).toEqual(["hard", "good", "easy"]);
  });

  it("lets learners judge an open answer after comparing it with a model", () => {
    const answer = {
      mode: "self_assess" as const,
      acceptedAnswers: ["Could you clarify which aspect you mean"],
      expectedAnswer: "Could you clarify which aspect you mean",
    };

    expect(
      reviewAnswerReady(answer, "Could you explain your question?", []),
    ).toBe(true);
    expect(expectedReviewAnswer(answer)).toBe(
      "Could you clarify which aspect you mean",
    );
    expect(reviewRatingsForAnswer(false, true)).toEqual([
      "again",
      "hard",
      "good",
      "easy",
    ]);
  });

  it("shows the real scheduling consequence of each rating", () => {
    expect(formatReviewInterval(10, "pl")).toBe("za 10 minut");
    expect(formatReviewInterval(720, "en")).toBe("in 12 hours");
    expect(formatReviewInterval(1440, "pl")).toBe("za 1 dzień");
    expect(formatReviewInterval(2880, "pl")).toBe("za 2 dni");
    expect(formatReviewInterval(5760, "pl")).toBe("za 4 dni");
    expect(formatReviewInterval(7200, "pl")).toBe("za 5 dni");
    expect(formatReviewInterval(60, "th")).toBe("ในอีก 1 ชั่วโมง");
  });

  it("does not require Intl.RelativeTimeFormat, which Hermes lacks", () => {
    const relativeTimeFormat = Intl.RelativeTimeFormat;
    Object.defineProperty(Intl, "RelativeTimeFormat", {
      configurable: true,
      value: undefined,
    });

    try {
      expect(formatReviewInterval(120, "pl")).toBe("za 2 godziny");
      expect(formatReviewInterval(120, "en")).toBe("in 2 hours");
    } finally {
      Object.defineProperty(Intl, "RelativeTimeFormat", {
        configurable: true,
        value: relativeTimeFormat,
      });
    }
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
