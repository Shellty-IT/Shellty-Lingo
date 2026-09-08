import { describe, expect, it } from "vitest";

import { learningTracks } from "../../prisma/learning-tracks";
import { exerciseFingerprint } from "../content/exercise-identity";

describe("expanded learning content", () => {
  it("assigns every task identity to exactly one exclusive level", () => {
    const levelByFingerprint = new Map<string, string>();

    for (const track of learningTracks)
      for (const exercise of track.modules.flatMap((module) =>
        module.lessons.flatMap((lesson) => lesson.exercises),
      )) {
        const fingerprint = exerciseFingerprint({
          language: track.language,
          type: exercise.type,
          prompt: exercise.prompt.en,
          options: exercise.options,
        });
        const assignedLevel = levelByFingerprint.get(fingerprint);
        expect(
          assignedLevel === undefined || assignedLevel === track.level,
        ).toBe(true);
        levelByFingerprint.set(fingerprint, track.level);
      }
  });

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
      const itTracks = learningTracks.filter(
        (track) => track.language === language && track.category === "it",
      );
      expect(itTracks.every((track) => track.modules.length === 1)).toBe(true);
      expect(itTracks.some((track) => track.level === "A1")).toBe(true);
      expect(itTracks.some((track) => track.level === "A2")).toBe(true);
      expect(itTracks.some((track) => track.level === "B1")).toBe(true);
      if (language === "en")
        expect(itTracks.some((track) => track.level === "B2")).toBe(true);
    },
  );

  it.each(["en", "th"] as const)(
    "provides dedicated vocabulary practice at every supported level in %s",
    (language) => {
      const vocabularyTracks = learningTracks.filter(
        (track) =>
          track.language === language && track.category === "vocabulary",
      );

      expect(new Set(vocabularyTracks.map((track) => track.level))).toEqual(
        language === "en"
          ? new Set(["A1", "A2", "B1", "B2", "C1"])
          : new Set(["A1", "A2", "B1", "B2"]),
      );
      for (const track of vocabularyTracks) {
        const lessons = track.modules.flatMap((module) => module.lessons);
        expect(lessons.length).toBeGreaterThan(0);
        expect(
          lessons.some((lesson) =>
            lesson.exercises.some(
              (exercise) => exercise.type === "single_choice",
            ),
          ),
        ).toBe(true);
        expect(
          lessons.some((lesson) => (lesson.vocabulary?.length ?? 0) > 0),
        ).toBe(true);
      }
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

  it("gives every B2 meaning question a sentence that supplies its context", () => {
    const b2Lessons = learningTracks
      .filter((track) => track.slug === "english-general-b2")
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons);

    expect(b2Lessons).toHaveLength(12);
    for (const lesson of b2Lessons) {
      const meaningQuestion = lesson.exercises.find(
        (exercise) => exercise.type === "single_choice",
      );
      expect(meaningQuestion?.prompt.en.startsWith("Context:\n“")).toBe(true);
      expect(meaningQuestion?.prompt.pl.startsWith("Kontekst:\n„")).toBe(true);
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
    expect(vocabularySelections.length).toBeGreaterThanOrEqual(6);
    for (const selection of vocabularySelections) {
      expect(selection.explanation).toBeTypeOf("object");
      if (!selection.explanation || typeof selection.explanation === "string")
        throw new Error("Expected a localized vocabulary explanation.");
      expect(selection.explanation.pl).toContain("•");
      expect(selection.explanation.en).toContain("•");
      expect(selection.explanation.th).toContain("•");
    }
  });

  it("provides the sentence referenced by contextual meaning questions", () => {
    const narrativeLesson = learningTracks
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.slug === "narrative-tenses-b2");
    const meaningExercise = narrativeLesson?.exercises[0];

    expect(meaningExercise?.prompt.en).toContain(
      "In hindsight, I should have checked the calendar before leaving home.",
    );
    expect(meaningExercise?.prompt.en).toContain(
      "What does “in hindsight” mean in this sentence?",
    );
    expect(meaningExercise?.prompt.pl).toContain(
      "Co w tym zdaniu oznacza „in hindsight”?",
    );
  });

  it("shows the full sentence context for otherwise before asking for its meaning", () => {
    const conditionalsLesson = learningTracks
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.slug === "conditionals-and-regrets-b2");
    const meaningExercise = conditionalsLesson?.exercises[0];

    expect(meaningExercise?.prompt.en).toBe(
      "Context:\n“The findings must be verified; otherwise, the recommendation cannot be approved.”\n\nWhat does “otherwise” mean in this sentence?",
    );
    expect(meaningExercise?.prompt.pl).toBe(
      "Kontekst:\n„The findings must be verified; otherwise, the recommendation cannot be approved.”\n\nCo w tym zdaniu oznacza „otherwise”?",
    );
  });

  it("provides a substantial, fully varied English B2 programme", () => {
    const generalB2 = learningTracks.find(
      (track) => track.slug === "english-general-b2",
    );
    const itB2 = learningTracks.find(
      (track) => track.slug === "english-for-it-b2",
    )?.modules[0];
    const b2Lessons = [
      ...(generalB2?.modules.flatMap((module) => module.lessons) ?? []),
      ...(itB2?.lessons ?? []),
    ];
    expect(generalB2?.modules).toHaveLength(4);
    expect(b2Lessons).toHaveLength(15);
    expect(
      b2Lessons.reduce((total, lesson) => total + lesson.exercises.length, 0),
    ).toBeGreaterThanOrEqual(78);
    expect(b2Lessons.every((lesson) => lesson.exercises.length === 6)).toBe(
      true,
    );
  });
});
