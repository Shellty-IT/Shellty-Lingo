import { describe, expect, it } from "vitest";
import type { LearnerExercise } from "@shellty/api-contracts";

import {
  answerIsReady,
  exerciseInstructionText,
  exercisePromptPresentation,
  expectedAnswerText,
  feedbackTone,
  orderingOptionText,
  tutorHintForExercise,
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

describe("independent sentence production", () => {
  const writing: LearnerExercise = {
    id: "emphasis",
    type: "typed_answer",
    position: 1,
    answerLanguage: "en",
    prompt: "Emphasise that communication was the main problem.",
    promptTranslation:
      "Napisz po angielsku: To komunikacja była głównym problemem.",
  };

  it("uses the localized task and reserves the English paraphrase for assistance", () => {
    expect(exercisePromptPresentation(writing, "pl", "en")).toEqual({
      primary: writing.promptTranslation,
      assistedPrompt: writing.prompt,
    });
    expect(
      exercisePromptPresentation(
        { ...writing, answerLanguage: undefined },
        "pl",
        "en",
      ).assistedPrompt,
    ).toBe(writing.prompt);
  });

  it.each([
    "gap_fill",
    "single_choice",
    "multiple_choice",
    "ordering",
    "matching",
    "listening",
  ] as const)("keeps necessary source context in %s tasks", (type) => {
    expect(
      exercisePromptPresentation({ ...writing, type }, "pl", "en"),
    ).toEqual({
      primary: writing.prompt,
      translation: writing.promptTranslation,
    });
  });

  it.each([
    undefined,
    "",
    "   ",
    " Emphasise that communication was the main problem. ",
  ])(
    "preserves the source when the translation is missing or duplicated: %s",
    (promptTranslation) => {
      const result = exercisePromptPresentation(
        { ...writing, promptTranslation },
        "pl",
        "en",
      );
      expect(result.primary).toBe(writing.prompt);
      expect(result.assistedPrompt).toBeUndefined();
    },
  );

  it("does not hide a same-language task or guess a different source language", () => {
    expect(
      exercisePromptPresentation(writing, "en", "en").assistedPrompt,
    ).toBeUndefined();
    const thai = {
      ...writing,
      answerLanguage: "th" as const,
      prompt: "ขอความช่วยเหลือ",
      promptTranslation: "Poproś o pomoc.",
    };
    expect(exercisePromptPresentation(thai, "pl", "th").primary).toBe(
      "Poproś o pomoc.",
    );
    expect(exercisePromptPresentation(thai, "th", "th").primary).toBe(
      thai.prompt,
    );
  });
});

it("restores the persisted tutor hint for the resumed exercise", () => {
  const hint = {
    exerciseId: "typed-2",
    hint: "Sprawdź szyk pytania.",
    focus: "word_order" as const,
    dynamic: true as const,
  };

  expect(
    tutorHintForExercise(
      [
        {
          exerciseId: "typed-1",
          hint: "Zwróć uwagę na czas.",
          focus: "grammar",
          dynamic: true,
        },
        hint,
      ],
      "typed-2",
    ),
  ).toEqual(hint);
});

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

it("requires every item before an ordering answer is ready", () => {
  const ordering: LearnerExercise = {
    id: "ordering",
    type: "ordering",
    prompt: "Order the words",
    position: 1,
    options: [
      { id: "a", text: "First" },
      { id: "b", text: "second" },
      { id: "c", text: "third" },
    ],
  };

  expect(answerIsReady(ordering, ["a", "b"], "", {})).toBe(false);
  expect(answerIsReady(ordering, ["a", "b", "c"], "", {})).toBe(true);
  expect(
    expectedAnswerText(ordering, ["a", "b", "c"], "First second third."),
  ).toBe("First second third.");
});

it("hides ordering clues while keeping meaningful spelling and symbols", () => {
  expect(
    [
      "Not only did",
      "the team restore the service,",
      "but it also documented",
      "the recovery procedure.",
    ].map(orderingOptionText),
  ).toEqual([
    "Not only did",
    "The team restore the service",
    "But it also documented",
    "The recovery procedure",
  ]);
  expect(orderingOptionText("I use C++ in the U.S.")).toBe(
    "I use C++ in the U.S.",
  );
  expect(orderingOptionText("The train leaves at 8:15.")).toBe(
    "The train leaves at 8:15",
  );
  expect(orderingOptionText("Don't skip the follow-up.")).toBe(
    "Don't skip the follow-up",
  );
  expect(orderingOptionText("ก่อนดำเนินการ")).toBe("ก่อนดำเนินการ");
});

it("does not let an English seed instruction override localized interface copy", () => {
  const exercise: LearnerExercise = {
    ...choice,
    instructions: "Choose one answer.",
  };

  expect(
    exerciseInstructionText(exercise, "pl", "Wybierz jedną odpowiedź."),
  ).toBe("Wybierz jedną odpowiedź.");
  expect(exerciseInstructionText(exercise, "en", "Choose an answer.")).toBe(
    "Choose one answer.",
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
