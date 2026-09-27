import { describe, expect, it } from "vitest";
import {
  learningCohort,
  learningEvidence,
  percentile,
  wilson,
  type EvidenceAttempt,
} from "./learning-evidence";
const origin = new Date("2026-01-01T00:00:00Z");
const sample = (
  days: number,
  change: Partial<EvidenceAttempt> = {},
): EvidenceAttempt => ({
  userCourseId: "course",
  language: "en",
  level: "A2",
  skillKey: "en.a2.meeting",
  contentFingerprint: days ? "new" : "original",
  answeredAt: new Date(origin.getTime() + days * 86400000),
  correct: true,
  feedback: {
    assessment: { status: "graded", policyVersion: "answer-v2" },
    experiment: {
      version: "learning-pilot-v1",
      cohort: learningCohort("course"),
    },
  },
  ...change,
});
describe("delayed learning evidence", () => {
  it("keeps immature follow-up missing rather than claiming retention", () => {
    const report = learningEvidence([sample(0)], sample(6).answeredAt);
    expect(
      report.metrics.every(
        (metric) => metric.eligible === 0 && metric.proportion === null,
      ),
    ).toBe(true);
    expect(report.recommendation).toBe("needs_data");
  });
  it("requires a new content identity and excludes assisted and unresolved attempts", () => {
    const report = learningEvidence(
      [
        sample(0),
        sample(7, { contentFingerprint: "original" }),
        sample(8, { feedback: { assisted: true } }),
        sample(9, { feedback: { assessment: { status: "needs_review" } } }),
        sample(30, { contentFingerprint: "month-context" }),
      ],
      sample(31).answeredAt,
    );
    const metrics = report.metrics.filter(
      (metric) =>
        metric.language === "en" && metric.cohort === learningCohort("course"),
    );
    expect(metrics[0]).toMatchObject({
      eligible: 1,
      observed: 0,
      missing: 1,
      proportion: null,
    });
    expect(metrics[1]).toMatchObject({
      observed: 1,
      correct: 1,
      proportion: 1,
    });
    expect(report.exclusions).toMatchObject({ assisted: 1, unresolved: 1 });
  });
  it("deduplicates repeated probes and supplies uncertainty bounds", () => {
    const report = learningEvidence(
      [sample(0), sample(7), sample(8)],
      sample(40).answeredAt,
    );
    const d7 = report.metrics.find(
      (metric) =>
        metric.language === "en" &&
        metric.cohort === learningCohort("course") &&
        metric.days === 7,
    )!;
    expect(d7.observed).toBe(1);
    expect(d7.confidence95?.[0]).toBeLessThan(0.3);
    expect(wilson(0, 0)).toBeNull();
  });
  it("does not count a context practiced before the follow-up window as transfer", () => {
    const report = learningEvidence(
      [sample(0), sample(1, { feedback: { assisted: true } }), sample(7)],
      sample(8).answeredAt,
    );
    expect(
      report.metrics.find(
        (metric) => metric.days === 7 && metric.eligible === 1,
      ),
    ).toMatchObject({ observed: 0, missing: 1 });
  });
  it("never counts future observations or ungraded metadata", () => {
    const report = learningEvidence(
      [
        sample(0),
        sample(9),
        sample(7, { feedback: { assessment: { policyVersion: "answer-v2" } } }),
      ],
      sample(8).answeredAt,
    );
    expect(
      report.metrics.find(
        (metric) => metric.days === 7 && metric.eligible === 1,
      ),
    ).toMatchObject({ observed: 0 });
    expect(report.exclusions.missingRubric).toBe(1);
  });
  it("keeps allocation stable per course and reports missing timing explicitly", () => {
    expect(learningCohort("course")).toBe(learningCohort("course"));
    expect(percentile([], 0.95)).toBeNull();
    expect(percentile([100, 10, 50], 0.95)).toBe(100);
  });
});
