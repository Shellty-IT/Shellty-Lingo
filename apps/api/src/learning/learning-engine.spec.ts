import { describe, expect, it } from "vitest";

import {
  gradeExercise,
  gradePlacement,
  learnerDayKey,
  questionsFor,
  scheduleReview,
} from "./learning-engine";

describe("deterministic exercise grading", () => {
  it.each([
    ["single_choice", { correct: "a" }, "a", true],
    ["listening", { correct: "b" }, { selected: "b" }, true],
    ["multiple_choice", { correct: ["a", "c"] }, ["c", "a"], true],
    ["gap_fill", { accepted: ["went"] }, { text: " Went. " }, true],
    ["typed_answer", { correct: "Hello world" }, "hello, world!", true],
    ["ordering", { correct: ["a", "b", "c"] }, ["a", "c", "b"], false],
    [
      "matching",
      { pairs: { coffee: "kawa", water: "woda" } },
      { pairs: { coffee: "kawa", water: "woda" } },
      true,
    ],
  ] as const)("grades %s answers", (type, expected, submitted, correct) => {
    expect(gradeExercise(type, expected, submitted).correct).toBe(correct);
  });

  it("returns partial scores for ordering and matching", () => {
    expect(
      gradeExercise("ordering", { correct: ["a", "b", "c"] }, ["a", "c", "b"])
        .score,
    ).toBeCloseTo(1 / 3);
    expect(
      gradeExercise(
        "matching",
        { pairs: { a: "1", b: "2" } },
        { pairs: { a: "1", b: "3" } },
      ).score,
    ).toBe(0.5);
  });
});

// The answer key is deliberately module-private, so the only way to learn a
// correct option is to probe the grader. Asserting exactly one option grades
// as correct also proves no question has a broken or duplicated answer key.
const correctOptionFor = (
  language: "en" | "th",
  questionId: string,
): string => {
  const question = questionsFor(language).find(
    (candidate) => candidate.id === questionId,
  );
  const matching = (question?.options ?? []).filter(
    (option) =>
      gradePlacement(language, [{ questionId, selectedOptionId: option.id }])
        .correct === 1,
  );
  expect(matching, `question ${questionId}`).toHaveLength(1);
  return matching[0]!.id;
};

describe("placement test", () => {
  it("does not expose answer keys to the client", () => {
    expect(questionsFor("en")).toHaveLength(20);
    expect(questionsFor("en")[0]).not.toHaveProperty("correct");
  });

  it("returns placement content in the selected interface locale", () => {
    expect(questionsFor("en", "en")[0]?.prompt).toContain("sentence");
    expect(questionsFor("th", "th")[0]?.prompt).toContain("คำ");
  });

  // The question bank and its per-locale copy live in parallel arrays matched
  // by index, so a missing or misordered entry degrades silently to the Polish
  // base text instead of failing. These invariants catch that.
  it.each(["en", "th"] as const)(
    "localizes every %s question into every interface locale",
    (language) => {
      const base = questionsFor(language, "pl");
      for (const locale of ["en", "th"] as const) {
        const localized = questionsFor(language, locale);
        expect(localized).toHaveLength(base.length);
        localized.forEach((question, index) => {
          const source = base[index];
          expect(question.id).toBe(source?.id);
          expect(question.prompt.length).toBeGreaterThan(0);
          expect(question.options).toHaveLength(source?.options.length ?? 0);
          question.options.forEach((option, optionIndex) => {
            expect(option.id).toBe(source?.options[optionIndex]?.id);
            expect(option.text.length).toBeGreaterThan(0);
          });
        });
      }
    },
  );

  it.each(["en", "th"] as const)(
    "keeps %s question ids unique so answers map to one question each",
    (language) => {
      const ids = questionsFor(language).map((question) => question.id);
      expect(new Set(ids).size).toBe(ids.length);
    },
  );

  it("scores a fully correct submission as 100 for both languages", () => {
    // Guards the answer key itself: every question must have its `correct`
    // option present among the options the client is offered.
    for (const language of ["en", "th"] as const) {
      const questions = questionsFor(language);
      const perfect = questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: correctOptionFor(language, question.id),
      }));
      const result = gradePlacement(language, perfect);
      expect(result).toMatchObject({
        correct: questions.length,
        total: questions.length,
        score: 100,
        level: "B1",
      });
    }
  });

  it("maps deterministic score bands to starting levels", () => {
    expect(gradePlacement("en", []).level).toBe("A1");
    expect(
      gradePlacement("en", [
        { questionId: "en-vocabulary-1", selectedOptionId: "a" },
        { questionId: "en-grammar-1", selectedOptionId: "b" },
        { questionId: "en-vocabulary-2", selectedOptionId: "a" },
        { questionId: "en-grammar-2", selectedOptionId: "c" },
        { questionId: "en-listening-1", selectedOptionId: "b" },
        { questionId: "en-grammar-3", selectedOptionId: "a" },
        { questionId: "en-vocabulary-3", selectedOptionId: "a" },
        { questionId: "en-grammar-4", selectedOptionId: "b" },
      ]).level,
    ).toBe("A2");
    expect(
      gradePlacement("en", [
        { questionId: "en-vocabulary-1", selectedOptionId: "a" },
        { questionId: "en-grammar-1", selectedOptionId: "b" },
        { questionId: "en-vocabulary-2", selectedOptionId: "a" },
        { questionId: "en-grammar-2", selectedOptionId: "c" },
        { questionId: "en-listening-1", selectedOptionId: "b" },
        { questionId: "en-grammar-3", selectedOptionId: "a" },
        { questionId: "en-vocabulary-3", selectedOptionId: "a" },
        { questionId: "en-grammar-4", selectedOptionId: "b" },
        { questionId: "en-vocabulary-4", selectedOptionId: "a" },
        { questionId: "en-grammar-5", selectedOptionId: "a" },
        { questionId: "en-listening-2", selectedOptionId: "a" },
        { questionId: "en-vocabulary-5", selectedOptionId: "a" },
        { questionId: "en-grammar-6", selectedOptionId: "a" },
        { questionId: "en-vocabulary-6", selectedOptionId: "a" },
        { questionId: "en-grammar-7", selectedOptionId: "b" },
        { questionId: "en-listening-3", selectedOptionId: "b" },
        { questionId: "en-vocabulary-7", selectedOptionId: "a" },
      ]).level,
    ).toBe("B1");
  });
});

describe("spaced repetition scheduling", () => {
  const initial = {
    intervalMinutes: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
  };
  const now = new Date("2026-03-28T22:30:00.000Z");

  it("uses explicit, reproducible intervals for every rating", () => {
    expect(scheduleReview(initial, "again", now).intervalMinutes).toBe(10);
    expect(scheduleReview(initial, "hard", now).intervalMinutes).toBe(720);
    expect(scheduleReview(initial, "good", now).intervalMinutes).toBe(1440);
    expect(scheduleReview(initial, "easy", now).intervalMinutes).toBe(5760);
  });

  it("keeps scheduling based on instants across daylight-saving changes", () => {
    const result = scheduleReview(initial, "good", now);
    expect(result.dueAt.toISOString()).toBe("2026-03-29T22:30:00.000Z");
    expect(learnerDayKey(result.dueAt, 120)).toBe("2026-03-30");
    expect(learnerDayKey(result.dueAt, -240)).toBe("2026-03-29");
  });

  it("resets repetitions and records a lapse after a failed review", () => {
    const result = scheduleReview(
      { ...initial, intervalMinutes: 4320, repetitions: 2 },
      "again",
      now,
    );
    expect(result).toMatchObject({ repetitions: 0, lapses: 1 });
  });
});
