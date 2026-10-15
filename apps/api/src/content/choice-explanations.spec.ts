import { describe, expect, it } from "vitest";
import { learningTracks } from "../../prisma/learning-tracks";
import {
  englishExtraModules,
  thaiExtraModules,
  expandExercises,
} from "../../prisma/basic-lessons";
import {
  choiceExplanation,
  choiceTeaching,
  coversChoiceOptions,
} from "./choice-explanations";

describe("choice teaching coverage", () => {
  it("explains every option in every track and baseline lesson in all UI languages", () => {
    const exercises = [
      ...learningTracks.flatMap((track) =>
        track.modules.flatMap((module) =>
          module.lessons.flatMap((lesson) => lesson.exercises),
        ),
      ),
      ...englishExtraModules.flatMap((module) =>
        module.lessons.flatMap((lesson) => expandExercises(lesson, "en")),
      ),
      ...thaiExtraModules.flatMap((module) =>
        module.lessons.flatMap((lesson) => expandExercises(lesson, "th")),
      ),
    ].filter((exercise) => exercise.type === "multiple_choice");
    expect(exercises).toHaveLength(56);
    for (const exercise of exercises) {
      const options = exercise.options!;
      const expected = (exercise.answer as { correct: string[] }).correct;
      for (const locale of ["pl", "en", "th"] as const) {
        const explanation = choiceExplanation(locale, options, expected);
        expect(explanation, JSON.stringify(options)).toBeTruthy();
        expect(coversChoiceOptions(explanation, options)).toBe(true);
        expect(explanation!.split("\n\n")).toHaveLength(options.length + 1);
        expect(exercise.explanation).toBeTypeOf("object");
        expect(
          coversChoiceOptions(
            (exercise.explanation as Record<string, string>)[locale],
            options,
          ),
        ).toBe(true);
      }
    }
  });

  it("keeps explanations attached to sentences when IDs and option order change", () => {
    const choices = choiceTeaching[1]!.choices;
    const options = [...choices]
      .reverse()
      .map((choice, i) => ({ id: `new-${i}`, text: choice.text }));
    const expected = options
      .filter((option) =>
        choices.some((choice) => choice.text === option.text && choice.correct),
      )
      .map((option) => option.id);
    const explanation = choiceExplanation("pl", options, expected)!;
    expect(explanation).toContain("III okres warunkowy");
    expect(explanation).toContain("II okres");
    expect(explanation).toContain("Will moved jest niegramatyczne");
    expect(explanation).toContain("If it is easier, we will move faster.");
    expect(explanation).toContain("Samo was bywa dopuszczalne");
    expect(explanation.indexOf(options[0]!.text)).toBeLessThan(
      explanation.indexOf(options[1]!.text),
    );
    expect(
      choiceExplanation("pl", options, ["new-0", "new-1"]),
    ).toBeUndefined();
    expect(choiceExplanation("pl", options.slice(1), expected)).toBeUndefined();
    expect(
      choiceExplanation("pl", options, [...expected, expected[0]]),
    ).toBeUndefined();
    expect(
      choiceExplanation(
        "pl",
        [
          { ...options[0]!, text: "A different sentence." },
          ...options.slice(1),
        ],
        expected,
      ),
    ).toBeUndefined();
  });

  it("does not invent grammatical errors for contextually unsuitable sentences", () => {
    const group = choiceTeaching.find(
      (entry) =>
        entry.choices[0]?.text ===
        "The change appears to have improved retention.",
    )!;
    const options = group.choices.map((choice, i) => ({
      id: String(i),
      text: choice.text,
    }));
    const explanation = choiceExplanation("pl", options, ["0", "1"]);
    expect(explanation).toContain("Wszystkie zdania są gramatyczne");
    expect(explanation).toContain("May + bezokolicznik");
    expect(explanation).toContain("nieuzasadnioną pewność");
  });

  it("preserves the source context when the same Thai vowel has opposite verdicts", () => {
    const lesson = thaiExtraModules
      .flatMap((module) => module.lessons)
      .find((entry) => entry.slug === "vowels-basics")!;
    const exercise = expandExercises(lesson, "th").find(
      (entry) => entry.type === "multiple_choice",
    )!;
    expect(exercise.prompt.pl).toContain(lesson.exercises[0]!.prompt.pl);
    expect(exercise.prompt.pl).toContain(lesson.exercises[1]!.prompt.pl);
    expect(exercise.options).toContainEqual({ id: "b", text: "[2] า" });
    expect(exercise.options).toContainEqual({ id: "c", text: "[1] า" });
    const explanation = choiceExplanation("pl", exercise.options!, ["a", "b"]);
    expect(explanation).toContain("✓ Poprawna odpowiedź: „[2] า”");
    expect(explanation).toContain("✗ Niepoprawna odpowiedź: „[1] า”");
  });
});
