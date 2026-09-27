import { createHash } from "node:crypto";

export const LEARNING_EXPERIMENT_VERSION = "learning-pilot-v1";
export function learningCohort(userCourseId: string): "control" | "pilot" {
  return createHash("sha256")
    .update(`${LEARNING_EXPERIMENT_VERSION}:${userCourseId}`)
    .digest()[0]! % 2
    ? "pilot"
    : "control";
}
export function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)]!;
}
export function wilson(
  successes: number,
  total: number,
): [number, number] | null {
  if (!total) return null;
  const z = 1.96,
    p = successes / total,
    denominator = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) /
    denominator;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}
export interface EvidenceAttempt {
  exerciseType?: string;
  userCourseId: string;
  language: string;
  level: string;
  skillKey: string | null;
  contentFingerprint: string;
  answeredAt: Date;
  correct: boolean;
  feedback: unknown;
}
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

/** Server-recorded first attempts only; corrections and self-ratings are not evidence. */
export function learningEvidence(attempts: EvidenceAttempt[], now: Date) {
  const identity = (attempt: EvidenceAttempt) =>
    JSON.stringify([
      attempt.userCourseId,
      attempt.level,
      attempt.skillKey,
      attempt.contentFingerprint,
    ]);
  // Include assisted and unresolved exposures: the learner has already seen
  // those contexts even though their results cannot demonstrate mastery.
  const firstSeen = new Map<string, number>();
  for (const attempt of attempts) {
    const key = identity(attempt);
    firstSeen.set(
      key,
      Math.min(firstSeen.get(key) ?? Infinity, attempt.answeredAt.getTime()),
    );
  }
  let assisted = 0,
    unresolved = 0,
    missingRubric = 0,
    missingExposure = 0,
    nonProduction = 0;
  const valid = attempts
    .filter((attempt) => {
      const feedback = record(attempt.feedback),
        assessment = record(feedback["assessment"]);
      if (attempt.exerciseType && attempt.exerciseType !== "typed_answer") {
        nonProduction++;
        return false;
      }
      if (feedback["assisted"] === true) {
        assisted++;
        return false;
      }
      if (assessment["status"] === "needs_review") {
        unresolved++;
        return false;
      }
      if (
        assessment["status"] !== "graded" ||
        assessment["policyVersion"] !== "answer-v2" ||
        !attempt.skillKey
      ) {
        missingRubric++;
        return false;
      }
      const exposure = record(feedback["experiment"]);
      if (
        exposure["version"] !== LEARNING_EXPERIMENT_VERSION ||
        (exposure["cohort"] !== "control" && exposure["cohort"] !== "pilot")
      ) {
        missingExposure++;
        return false;
      }
      return true;
    })
    .sort((a, b) => a.answeredAt.getTime() - b.answeredAt.getTime());
  const groups = new Map<string, EvidenceAttempt[]>();
  for (const attempt of valid) {
    const key = `${attempt.userCourseId}:${attempt.level}:${attempt.skillKey}`;
    const samples = groups.get(key) ?? [];
    samples.push(attempt);
    groups.set(key, samples);
  }
  const levels = [...new Set(valid.map((attempt) => attempt.level))];
  if (!levels.length) levels.push("A2");
  const metrics = (["en", "th"] as const).flatMap((language) =>
    levels.flatMap((level) =>
      (["control", "pilot"] as const).flatMap((cohort) =>
        ([7, 30] as const).map((days) => {
          let eligible = 0,
            observed = 0,
            correct = 0;
          const users = new Set<string>();
          for (const samples of groups.values()) {
            const first = samples[0]!;
            if (
              first.language !== language ||
              first.level !== level ||
              record(record(first.feedback)["experiment"])["cohort"] !== cohort
            )
              continue;
            const due = first.answeredAt.getTime() + days * 86400000;
            if (due > now.getTime()) continue;
            eligible++;
            users.add(first.userCourseId);
            // A different content identity is required. Repeating the displayed
            // model is not transfer. Missing follow-up stays missing, never false.
            const probe = samples.find(
              (sample) =>
                record(record(sample.feedback)["experiment"])["cohort"] ===
                  cohort &&
                sample.answeredAt.getTime() >= due &&
                sample.answeredAt.getTime() <
                  due + (days === 7 ? 3 : 7) * 86400000 &&
                sample.answeredAt.getTime() <= now.getTime() &&
                (firstSeen.get(identity(sample)) ?? -Infinity) >= due &&
                sample.contentFingerprint !== first.contentFingerprint,
            );
            if (probe) {
              observed++;
              if (probe.correct) correct++;
            }
          }
          return {
            language,
            level,
            cohort,
            days,
            eligible,
            observed,
            missing: eligible - observed,
            users: users.size,
            correct,
            proportion: observed ? correct / observed : null,
            confidence95: wilson(correct, observed),
          };
        }),
      ),
    ),
  );
  return {
    experimentVersion: LEARNING_EXPERIMENT_VERSION,
    metrics,
    exclusions: {
      assisted,
      unresolved,
      missingRubric,
      missingExposure,
      nonProduction,
    },
    recommendation: metrics.every(
      (item) => item.users >= 30 && item.observed >= 30,
    )
      ? ("review_required" as const)
      : ("needs_data" as const),
    notes: [
      "Cohorts come from frozen session exposure; allocation is stored once per user course.",
      "Language and level matching, actual variant exposure, editorial probe equivalence and selection bias require review before causal interpretation.",
      "Thirty observations is a descriptive data gate, not a power calculation or approval to expand.",
    ],
  };
}
