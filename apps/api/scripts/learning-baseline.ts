import { performance } from "node:perf_hooks";
import { mkdirSync, writeFileSync } from "node:fs";
import { learningTracks } from "../prisma/learning-tracks";
import { exerciseTypes } from "@shellty/api-contracts";
import { gradeExercise } from "../src/learning/learning-engine";
import { percentile } from "../src/release/learning-evidence";

const inventory = learningTracks.flatMap((track) =>
  track.modules.flatMap((module) =>
    module.lessons.flatMap((lesson) =>
      lesson.exercises.map((exercise) => ({
        language: track.language,
        level: track.level,
        lesson: `${track.slug}:${module.slug}:${lesson.slug}`,
        exercise,
      })),
    ),
  ),
);
const matrix = (["en", "th"] as const).flatMap((language) =>
  (["A1", "A2", "B1", "B2", "C1"] as const).flatMap((level) =>
    exerciseTypes.map((type) => ({
      language,
      level,
      type,
      count: inventory.filter(
        (row) =>
          row.language === language &&
          row.level === level &&
          row.exercise.type === type,
      ).length,
    })),
  ),
);
const timings = inventory.map(({ exercise }) => {
  const answer = exercise.answer as { accepted?: string[]; correct?: unknown };
  const started = performance.now();
  gradeExercise(
    exercise.type,
    exercise.answer,
    answer.accepted?.[0] ?? answer.correct,
  );
  return performance.now() - started;
});
const result = {
  generatedAt: new Date().toISOString(),
  source: "local authored catalogue, not the published database",
  exercises: inventory.length,
  lessons: new Set(inventory.map((row) => row.lesson)).size,
  matrix,
  deterministicCpuOnly: {
    samples: timings.length,
    p50Ms: percentile(timings, 0.5),
    p95Ms: percentile(timings, 0.95),
  },
  deviceSessions: 0,
  networkLatency: null,
  screenReaderAcceptance: "pending",
  notes: [
    "This CPU sample does not measure API, AI, mobile rendering or network performance.",
    "Collect 6–8 observed Android/iOS sessions before interpreting user comfort or timing budgets.",
  ],
};
mkdirSync("docs/product/learning-rollout", { recursive: true });
writeFileSync(
  "docs/product/learning-rollout/baseline.json",
  JSON.stringify(result, null, 2) + "\n",
);
process.stdout.write(
  JSON.stringify({
    exercises: result.exercises,
    lessons: result.lessons,
    p95CpuMs: result.deterministicCpuOnly.p95Ms,
  }) + "\n",
);
