import { describe, expect, it } from "vitest";
import {
  pilotLessonIds,
  pilotLesson,
  pilotProbe,
  pilotPreview,
} from "@shellty/api-contracts";
import { gradeExercise } from "../learning/learning-engine";
describe("editorial communication lesson drafts", () => {
  it("contains three goals for each language and never publishes them", () => {
    expect(pilotLessonIds).toHaveLength(6);
    for (const language of ["en", "th"])
      expect(
        pilotLessonIds.filter((id) => id.startsWith(language)),
      ).toHaveLength(3);
  });
  it("uses new contexts for delayed transfer probes", () => {
    for (const id of pilotLessonIds) {
      const baseline = pilotLesson(id, "en")!;
      const week = pilotProbe(id, 7, "en")!;
      const month = pilotProbe(id, 30, "en")!;
      expect(week.exercises[0]!.skillKey).toBe(baseline.exercises[0]!.skillKey);
      expect(week.exercises[0]!.prompt).not.toBe(month.exercises[0]!.prompt);
      for (const probe of [week, month]) {
        const task = probe.exercises[0]!;
        expect(
          baseline.exercises.some((item) => item.prompt === task.prompt),
        ).toBe(false);
        expect(
          gradeExercise(task.type, task.answer, task.answer.accepted[0])
            .correct,
        ).toBe(true);
      }
    }
  });
  it.each(["pl", "en", "th"] as const)(
    "uses the same task contract for %s editor and mobile previews",
    (locale) => {
      for (const id of pilotLessonIds) {
        const lesson = pilotLesson(id, locale)!,
          preview = pilotPreview(id, locale)!;
        expect(lesson.status).toBe("draft");
        expect(
          preview.exercises.every(
            (exercise) =>
              !("answer" in exercise) &&
              exercise.instructionsLocale === locale &&
              exercise.skillKey,
          ),
        ).toBe(true);
        expect(
          lesson.exercises.filter((exercise) => exercise.interaction),
        ).toHaveLength(1);
        for (const exercise of lesson.exercises) {
          const answer = exercise.answer as {
            accepted?: string[];
            correct?: unknown;
          };
          expect(
            gradeExercise(
              exercise.type,
              answer,
              answer.accepted?.[0] ?? answer.correct,
            ).correct,
          ).toBe(true);
        }
      }
    },
  );
});
