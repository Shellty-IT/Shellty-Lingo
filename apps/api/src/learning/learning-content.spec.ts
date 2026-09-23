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
          ? new Set([
              "general",
              "vocabulary",
              "grammar",
              "phrases",
              "business",
              "it",
            ])
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
        expect(lessons.length).toBeGreaterThanOrEqual(
          language === "en" ? 2 : 1,
        );
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
        if (language === "en") {
          const words = lessons.flatMap((lesson) => lesson.vocabulary ?? []);
          expect(new Set(words.map((word) => word.term)).size).toBe(
            words.length,
          );
        }
        for (const lesson of lessons) {
          const types = new Set(
            lesson.exercises.map((exercise) => exercise.type),
          );
          expect(types.has("single_choice")).toBe(true);
          if (language === "en") expect(types.has("gap_fill")).toBe(true);
        }
      }
    },
  );

  it("gives B2 learners several vocabulary lessons with distinct words and contextual recall", () => {
    const track = learningTracks.find(
      (item) => item.slug === "english-vocabulary-b2",
    );
    const lessons = track?.modules.flatMap((module) => module.lessons) ?? [];
    const words = lessons.flatMap((lesson) => lesson.vocabulary ?? []);

    expect(lessons.length).toBeGreaterThanOrEqual(4);
    expect(words.length).toBeGreaterThanOrEqual(28);
    expect(new Set(words.map((word) => word.term)).size).toBe(words.length);
    for (const lesson of lessons) {
      expect(
        lesson.exercises.filter((exercise) => exercise.type === "gap_fill"),
      ).toHaveLength(lesson.vocabulary?.length ?? 0);
      for (const word of lesson.vocabulary ?? [])
        expect(word.example).toContain(word.term);
    }
  });

  it("keeps choice answers valid and varies their positions", () => {
    const b2Lessons = learningTracks
      .filter((track) => track.slug === "english-general-b2")
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons);
    const answerPositions = new Set<string>();

    for (const lesson of b2Lessons)
      for (const exercise of lesson.exercises) {
        if (exercise.type !== "single_choice" && exercise.type !== "listening")
          continue;
        const answer = exercise.answer as { correct: string };
        expect(
          exercise.options?.some((option) => option.id === answer.correct),
        ).toBe(true);
        expect(
          new Set(exercise.options?.map((option) => option.text)).size,
        ).toBe(4);
        answerPositions.add(answer.correct);
      }

    expect(answerPositions.size).toBe(4);
  });

  it("keeps B2 grammar separate from vocabulary and listening exercises", () => {
    const grammarTrack = learningTracks.find(
      (track) => track.slug === "english-grammar-b2",
    );
    const lessons =
      grammarTrack?.modules.flatMap((module) => module.lessons) ?? [];

    expect(lessons).toHaveLength(3);
    for (const lesson of lessons) {
      expect(lesson.vocabulary).toBeUndefined();
      expect(lesson.exercises).toHaveLength(4);
      expect(
        lesson.exercises.every((exercise) =>
          ["multiple_choice", "gap_fill", "typed_answer", "ordering"].includes(
            exercise.type,
          ),
        ),
      ).toBe(true);
    }
  });

  it("uses varied, substantial exercises in every new lesson", () => {
    const requiredTypes = new Set([
      "single_choice",
      "multiple_choice",
      "gap_fill",
      "typed_answer",
      "ordering",
      "listening",
    ]);
    for (const track of learningTracks)
      for (const lesson of track.modules.flatMap((module) => module.lessons)) {
        expect(lesson.estimatedMinutes).toBeGreaterThanOrEqual(10);
        if (track.category === "vocabulary") {
          expect(lesson.exercises.length).toBeGreaterThanOrEqual(8);
          if (track.language === "en") {
            expect(
              new Set(lesson.exercises.map((exercise) => exercise.type)),
            ).toEqual(new Set(["single_choice", "gap_fill"]));
            expect(
              lesson.exercises.filter(
                (exercise) => exercise.type === "gap_fill",
              ),
            ).toHaveLength(lesson.vocabulary?.length ?? 0);
          } else {
            expect(
              lesson.exercises.every(
                (exercise) =>
                  exercise.type === "single_choice" &&
                  exercise.options?.length === 4,
              ),
            ).toBe(true);
          }
        } else if (track.category === "grammar") {
          expect(lesson.exercises).toHaveLength(4);
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
      for (const word of lesson.vocabulary ?? [])
        expect(word.example?.trim()).toBeTruthy();
    }
  });

  it("asks B2 learners to translate a concrete Polish sentence", () => {
    const b2Lessons = learningTracks
      .filter((track) => track.slug === "english-general-b2")
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons);

    for (const lesson of b2Lessons) {
      const writing = lesson.exercises.find(
        (exercise) => exercise.type === "typed_answer",
      );
      expect(writing?.prompt.pl.startsWith("Napisz po angielsku: ")).toBe(true);
      expect(
        writing?.prompt.pl.endsWith(".") || writing?.prompt.pl.endsWith("?"),
      ).toBe(true);
    }
  });

  it("uses distinct A1 words for recognition and written recall", () => {
    const drill = learningTracks
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.slug === "english-polish-four-choice");
    expect(drill?.exercises).toHaveLength(8);
    expect(drill?.vocabulary?.map((item) => item.term)).toEqual([
      "message",
      "meeting",
      "email",
      "task",
    ]);
    expect(
      drill?.exercises.filter((exercise) => exercise.type === "single_choice"),
    ).toHaveLength(4);
    expect(
      drill?.exercises.filter((exercise) => exercise.type === "gap_fill"),
    ).toHaveLength(4);
  });

  it("explains each vocabulary word in every interface language", () => {
    const vocabularyExercises = learningTracks
      .filter((track) => track.category === "vocabulary")
      .flatMap((track) => track.modules)
      .flatMap((module) => module.lessons)
      .filter((lesson) => lesson.slug !== "english-polish-four-choice")
      .flatMap((lesson) => lesson.exercises);

    expect(vocabularyExercises.length).toBeGreaterThanOrEqual(72);
    for (const exercise of vocabularyExercises) {
      expect(exercise.explanation).toBeTypeOf("object");
      if (!exercise.explanation || typeof exercise.explanation === "string")
        throw new Error("Expected a localized vocabulary explanation.");
      expect(exercise.explanation.pl).not.toHaveLength(0);
      expect(exercise.explanation.en).not.toHaveLength(0);
      expect(exercise.explanation.th).not.toHaveLength(0);
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
