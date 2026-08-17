import { describe, expect, it } from "vitest";

import {
  gradeExercise,
  gradePlacement,
  learnerDayKey,
  PLACEMENT_QUESTION_COUNT,
  placementQuestionsFor,
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
    expect(questionsFor("en").length).toBeGreaterThan(35);
    expect(questionsFor("en")[0]).not.toHaveProperty("correct");
  });

  it("creates a balanced random form that remains stable for one seed", () => {
    const first = placementQuestionsFor("en", "pl", 12345);
    const resumed = placementQuestionsFor("en", "pl", 12345);
    const nextSession = placementQuestionsFor("en", "pl", 98765);

    expect(first).toEqual(resumed);
    expect(first).toHaveLength(PLACEMENT_QUESTION_COUNT);
    expect(first).not.toEqual(nextSession);
    for (const skill of ["vocabulary", "grammar", "listening"] as const)
      expect(first.filter((question) => question.skill === skill)).toHaveLength(
        10,
      );
    expect(
      first.filter((question) => question.id.startsWith("en-b2-")).length,
    ).toBe(12);
    const correctFirst = first.filter(
      (question) =>
        question.options[0]?.id === correctOptionFor("en", question.id),
    );
    expect(correctFirst.length).toBeGreaterThan(0);
    expect(correctFirst.length).toBeLessThan(first.length);
  });

  it("returns placement content in the selected interface locale", () => {
    expect(questionsFor("en", "en")[0]?.prompt).toContain("sentence");
    expect(questionsFor("th", "th")[0]?.prompt).toContain("คำ");
  });

  it("keeps English placement prompts semantically unambiguous", () => {
    const questions = questionsFor("en", "en");
    const advice = questions.find((question) => question.id === "en-grammar-5");
    const acknowledgement = questions.find(
      (question) => question.id === "en-listening-4",
    );

    expect(advice?.prompt).toContain("that's my advice");
    expect(advice?.options.map((option) => option.text)).toEqual([
      "should",
      "have",
      "are",
      "None of the other answers.",
    ]);
    expect(acknowledgement?.prompt).toContain("someone's point");
    expect(acknowledgement?.prompt).not.toContain("completely");
  });

  it.each(["en", "th"] as const)(
    "provides playable source text for every %s listening item",
    (language) => {
      const listening = questionsFor(language).filter(
        (question) => question.skill === "listening",
      );
      expect(listening.length).toBeGreaterThanOrEqual(10);
      listening.forEach((question) =>
        expect(question.audioText?.trim().length, question.id).toBeGreaterThan(
          0,
        ),
      );
    },
  );

  it.each(["en", "th"] as const)(
    "provides exactly four answers for every %s placement question",
    (language) => {
      for (const locale of ["pl", "en", "th"] as const) {
        questionsFor(language, locale).forEach((question) =>
          expect(question.options, question.id).toHaveLength(4),
        );
      }
    },
  );

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
        level: language === "en" ? "B2" : "B1",
      });
    }
  });

  it("maps deterministic score bands to starting levels", () => {
    const form = placementQuestionsFor("en", "pl", 20260814);
    const questionIds = form.map((question) => question.id);
    const correctAnswers = form.map((question) => ({
      questionId: question.id,
      selectedOptionId: correctOptionFor("en", question.id),
    }));

    expect(gradePlacement("en", [], questionIds).level).toBe("A1");
    expect(
      gradePlacement("en", correctAnswers.slice(0, 12), questionIds).level,
    ).toBe("A2");
    expect(
      gradePlacement("en", correctAnswers.slice(0, 21), questionIds).level,
    ).toBe("B1");
    expect(
      gradePlacement("en", correctAnswers.slice(0, 27), questionIds).level,
    ).toBe("B2");
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
