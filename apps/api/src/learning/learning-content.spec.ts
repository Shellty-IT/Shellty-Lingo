import { describe, expect, it } from "vitest";

import { learningTracks } from "../../prisma/learning-tracks";

describe("expanded learning content", () => {
  it.each(["en", "th"] as const)(
    "provides separate learning categories for %s",
    (language) => {
      const categories = new Set(
        learningTracks
          .filter((track) => track.language === language)
          .map((track) => track.category),
      );
      expect(categories).toEqual(
        language === "en"
          ? new Set(["general", "vocabulary", "phrases", "business", "it"])
          : new Set(["vocabulary", "phrases", "business", "it"]),
      );
    },
  );

  it.each(["en", "th"] as const)(
    "contains IT modules for every supported placement level in %s",
    (language) => {
      const itTrack = learningTracks.find(
        (track) => track.language === language && track.category === "it",
      );
      const titles = itTrack?.modules.map((module) => module.title) ?? [];
      expect(titles.some((title) => title.includes("A1"))).toBe(true);
      expect(titles.some((title) => title.includes("A2"))).toBe(true);
      expect(titles.some((title) => title.includes("B1"))).toBe(true);
      if (language === "en")
        expect(titles.some((title) => title.includes("B2"))).toBe(true);
    },
  );

  it("uses varied, substantial exercises in every new lesson", () => {
    const requiredTypes = new Set([
      "single_choice",
      "multiple_choice",
      "gap_fill",
      "typed_answer",
      "ordering",
      "listening",
    ]);
    for (const lesson of learningTracks.flatMap((track) =>
      track.modules.flatMap((module) => module.lessons),
    )) {
      expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(10);
      if (lesson.slug === "english-polish-four-choice") {
        expect(lesson.exercises).toHaveLength(8);
        expect(
          lesson.exercises.every(
            (exercise) =>
              exercise.type === "single_choice" &&
              exercise.options?.length === 4,
          ),
        ).toBe(true);
      } else if (lesson.slug === "english-sentence-builder") {
        expect(lesson.exercises).toHaveLength(6);
        expect(
          lesson.exercises.every(
            (exercise) =>
              exercise.type === "ordering" &&
              (exercise.options?.length ?? 0) >= 4,
          ),
        ).toBe(true);
      } else {
        expect(lesson.exercises).toHaveLength(6);
        expect(
          new Set(lesson.exercises.map((exercise) => exercise.type)),
        ).toEqual(requiredTypes);
      }
      expect(
        lesson.exercises.every(
          (exercise) =>
            exercise.prompt.pl && exercise.prompt.en && exercise.prompt.th,
        ),
      ).toBe(true);
    }
  });

  it("includes four-choice Polish vocabulary in both directions", () => {
    const drill = learningTracks
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.slug === "english-polish-four-choice");
    expect(drill?.exercises).toHaveLength(8);
    expect(
      drill?.exercises.some((exercise) =>
        exercise.prompt.pl.includes("polskie znaczenie"),
      ),
    ).toBe(true);
    expect(
      drill?.exercises.some((exercise) =>
        exercise.prompt.pl.includes("angielskie tłumaczenie"),
      ),
    ).toBe(true);
  });

  it("explains the meanings of vocabulary expressions after selection", () => {
    const lessons = learningTracks
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons);
    const lesson = lessons.find(
      (candidate) => candidate.slug === "workplace-vocabulary",
    );
    const exercise = lesson?.exercises.find(
      (candidate) => candidate.type === "multiple_choice",
    );
    const explanation = exercise?.explanation;
    expect(explanation).toBeTypeOf("object");
    if (!explanation || typeof explanation === "string")
      throw new Error("Expected a localized explanation.");
    expect(explanation.pl).toContain("„due date” — termin wykonania");
    expect(explanation.en).toContain(
      "„on schedule” — progressing according to the planned timetable",
    );
    expect(explanation.th).toContain("„due date”");

    const vocabularySelections = lessons
      .flatMap((candidate) => candidate.exercises)
      .filter(
        (candidate) =>
          candidate.type === "multiple_choice" &&
          candidate.prompt.pl.startsWith("Wybierz dwa słowa"),
      );
    expect(vocabularySelections).toHaveLength(2);
    for (const selection of vocabularySelections) {
      expect(selection.explanation).toBeTypeOf("object");
      if (!selection.explanation || typeof selection.explanation === "string")
        throw new Error("Expected a localized vocabulary explanation.");
      expect(selection.explanation.pl).toContain("•");
      expect(selection.explanation.en).toContain("•");
      expect(selection.explanation.th).toContain("•");
    }
  });

  it("provides a substantial, fully varied English B2 programme", () => {
    const generalB2 = learningTracks.find(
      (track) => track.slug === "english-general-b2",
    );
    const itB2 = learningTracks
      .find((track) => track.slug === "english-for-it")
      ?.modules.find((module) => module.slug === "it-b2");
    const b2Lessons = [
      ...(generalB2?.modules.flatMap((module) => module.lessons) ?? []),
      ...(itB2?.lessons ?? []),
    ];
    expect(generalB2?.modules).toHaveLength(4);
    expect(b2Lessons).toHaveLength(13);
    expect(
      b2Lessons.reduce((total, lesson) => total + lesson.exercises.length, 0),
    ).toBeGreaterThanOrEqual(78);
    expect(b2Lessons.every((lesson) => lesson.exercises.length === 6)).toBe(
      true,
    );
  });
});
