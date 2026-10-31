import { describe, expect, it } from "vitest";
import { learningTracks } from "../../prisma/learning-tracks";
import {
  englishExtraModules,
  thaiExtraModules,
  expandExercises,
} from "../../prisma/basic-lessons";
import { orderingSentence, orderingTranslation } from "./ordering-translations";

describe("ordering sentence translations", () => {
  it("covers complete correct sentences in every course and baseline lesson", () => {
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
    ].filter((exercise) => exercise.type === "ordering");
    expect(exercises.length).toBeGreaterThan(35);
    for (const exercise of exercises) {
      const sentence = orderingSentence(exercise.options, exercise.answer);
      expect(sentence).toBeTruthy();
      for (const locale of ["pl", "en", "th"] as const)
        expect(
          orderingTranslation(sentence, locale),
          `${locale}: ${sentence}`,
        ).toBeTruthy();
      expect(orderingTranslation(sentence, "pl")).not.toBe(sentence);
    }
  });
  it("preserves the unreal past meaning in the reported conditional", () => {
    expect(
      orderingTranslation(
        "Had we anticipated the increase in traffic, we would have scaled the service in advance.",
        "pl",
      ),
    ).toBe(
      "Gdybyśmy przewidzieli wzrost ruchu, wcześniej zwiększylibyśmy wydajność usługi.",
    );
  });
  it("does not translate a wrong learner order or silently drop missing parts", () => {
    expect(
      orderingTranslation("the service in advance Had we anticipated", "pl"),
    ).toBeUndefined();
    expect(
      orderingSentence([{ id: "a", text: "Hello" }], {
        correct: ["a", "missing"],
      }),
    ).toBe("");
  });
});
