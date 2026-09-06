import { describe, expect, it } from "vitest";

import { exerciseFingerprint } from "./exercise-identity";

const task = {
  language: "en",
  type: "single_choice",
  prompt: " Choose   the answer. ",
  options: [{ id: "a", text: "Yes" }],
};

describe("exerciseFingerprint", () => {
  it("is stable across harmless prompt whitespace and casing differences", () => {
    expect(exerciseFingerprint(task)).toBe(
      exerciseFingerprint({
        ...task,
        prompt: "choose the answer.",
      }),
    );
  });

  it("keeps tasks for different learned languages distinct", () => {
    expect(exerciseFingerprint(task)).not.toBe(
      exerciseFingerprint({ ...task, language: "th" }),
    );
  });

  it("ignores presentation-only option order", () => {
    expect(
      exerciseFingerprint({
        ...task,
        options: [
          { id: "b", text: "No" },
          { id: "a", text: "Yes" },
        ],
      }),
    ).toBe(
      exerciseFingerprint({
        ...task,
        options: [
          { id: "a", text: "Yes" },
          { id: "b", text: "No" },
        ],
      }),
    );
  });
});
