import { describe, expect, it } from "vitest";
import { theoryLessons } from "./theory-content";

describe("theory library", () => {
  it("has substantive localized reading lessons at every supported course level", () => {
    expect(new Set(theoryLessons.map((lesson) => lesson.id)).size).toBe(
      theoryLessons.length,
    );
    for (const [language, levels] of [
      ["en", ["A1", "A2", "B1", "B2", "C1"]],
      ["th", ["A1", "A2", "B1", "B2"]],
    ] as const)
      for (const level of levels)
        expect(
          theoryLessons.some(
            (lesson) => lesson.language === language && lesson.level === level,
          ),
        ).toBe(true);
    for (const lesson of theoryLessons) {
      expect(lesson.formula.length).toBeGreaterThan(10);
      expect(lesson.examples.length).toBeGreaterThanOrEqual(2);
      for (const locale of ["pl", "en", "th"] as const) {
        expect(lesson.title[locale]).toBeTruthy();
        expect(lesson.introduction[locale].length).toBeGreaterThan(30);
        expect(lesson.rule[locale].length).toBeGreaterThan(100);
        expect(lesson.pitfalls[locale].length).toBeGreaterThan(30);
        for (const example of lesson.examples)
          expect(example.meaning[locale]).toBeTruthy();
      }
    }
  });
  it("teaches second and third conditionals and had-inversion before practice", () => {
    const second = theoryLessons.find(
      (lesson) => lesson.id === "en-second-conditional",
    )!;
    const third = theoryLessons.find(
      (lesson) => lesson.id === "en-third-conditional",
    )!;
    expect(second.rule.pl).toContain("would complete");
    expect(second.pitfalls.pl).toContain("nie Past Perfect");
    expect(third.rule.pl).toContain("Had we known = If we had known");
    expect(third.practiceSlugs).toContain("conditionals-and-regrets-b2");
  });
});
