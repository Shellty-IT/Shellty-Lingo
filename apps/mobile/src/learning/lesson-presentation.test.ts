import { describe, expect, it } from "vitest";
import type { LearnerExercise } from "@shellty/api-contracts";

import {
  answerIsReady,
  expectedAnswerText,
  feedbackTone,
} from "./lesson-presentation";

const choice: LearnerExercise = {
  id: "choice",
  type: "single_choice",
  prompt: "Choose",
  position: 1,
  options: [
    { id: "a", text: "First" },
    { id: "b", text: "Second" },
  ],
};

it("maps answer identifiers back to learner-facing option text", () => {
  expect(expectedAnswerText(choice, "b")).toBe("Second");
});

it("requires every pair before a matching answer is ready", () => {
  const matching: LearnerExercise = {
    id: "matching",
    type: "matching",
    prompt: "Match",
    position: 1,
    matching: {
      left: [
        { id: "l1", text: "One" },
        { id: "l2", text: "Two" },
      ],
      right: [
        { id: "r1", text: "Jeden" },
        { id: "r2", text: "Dwa" },
      ],
    },
  };

  expect(answerIsReady(matching, [], "", { l1: "r1" })).toBe(false);
  expect(answerIsReady(matching, [], "", { l1: "r1", l2: "r2" })).toBe(true);
  expect(expectedAnswerText(matching, { l1: "r1", l2: "r2" })).toBe(
    "One → Jeden\nTwo → Dwa",
  );
});

describe("feedback tone", () => {
  it("distinguishes partial credit from an incorrect answer", () => {
    expect(
      feedbackTone({
        attemptId: "1",
        exerciseId: "exercise",
        correct: false,
        score: 0.5,
        feedback: {},
        alreadyRecorded: false,
      }),
    ).toBe("partial");
  });
});
