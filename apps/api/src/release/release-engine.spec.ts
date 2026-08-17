import { describe, expect, it } from "vitest";
import {
  buildReleaseGates,
  calculateBetaMetrics,
  calculateProductBaseline,
  featureRolloutBucket,
} from "./release-engine";

describe("beta release engine", () => {
  it("calculates activation and retention from cohort events", () => {
    const now = new Date("2026-07-15T12:00:00Z");
    const metrics = calculateBetaMetrics({
      now,
      users: [
        {
          id: "a",
          createdAt: new Date("2026-07-01T10:00:00Z"),
          onboardingCompleted: true,
          events: [
            {
              name: "lesson_completed",
              createdAt: new Date("2026-07-01T11:00:00Z"),
            },
            { name: "app_opened", createdAt: new Date("2026-07-08T11:00:00Z") },
          ],
        },
        {
          id: "b",
          createdAt: new Date("2026-07-14T10:00:00Z"),
          onboardingCompleted: false,
          events: [],
        },
      ],
      conversationReports: 1,
      completedConversations: 20,
    });
    expect(metrics.activationPercent).toBe(50);
    expect(metrics.firstLessonCompletionPercent).toBe(50);
    expect(metrics.retentionD7Percent).toBe(100);
    expect(metrics.aiReportPercent).toBe(5);
  });

  it("holds rollout when a required gate is blocked", () => {
    const result = buildReleaseGates(
      {
        activationPercent: 70,
        firstLessonCompletionPercent: 70,
        firstConversationCompletionPercent: 50,
        retentionD1Percent: 40,
        retentionD7Percent: 10,
        aiReportPercent: 2,
        crashFreePercent: 99.9,
      },
      40,
    );
    expect(result.recommendation).toBe("hold");
  });

  it("assigns a stable rollout bucket", () => {
    expect(featureRolloutBucket("user-1", "listening_lab")).toBe(
      featureRolloutBucket("user-1", "listening_lab"),
    );
    expect(featureRolloutBucket("user-1", "listening_lab")).toBeLessThan(100);
  });

  it("calculates a privacy-safe product baseline from domain and UX events", () => {
    const baseline = calculateProductBaseline({
      newUsers: [
        {
          id: "a",
          createdAt: new Date("2026-08-01T10:00:00Z"),
          onboardingCompleted: true,
        },
        {
          id: "b",
          createdAt: new Date("2026-08-02T10:00:00Z"),
          onboardingCompleted: false,
        },
      ],
      events: [
        {
          userId: "a",
          name: "today_plan_viewed",
          createdAt: new Date("2026-08-01T10:05:00Z"),
        },
        {
          userId: "a",
          name: "today_plan_item_selected",
          createdAt: new Date("2026-08-01T10:06:00Z"),
        },
        {
          userId: "a",
          name: "lesson_started",
          createdAt: new Date("2026-08-01T10:07:00Z"),
        },
        {
          userId: "a",
          name: "lesson_completed",
          createdAt: new Date("2026-08-01T10:17:00Z"),
        },
        {
          userId: "b",
          name: "lesson_started",
          createdAt: new Date("2026-08-02T10:03:00Z"),
        },
      ],
    });

    expect(baseline).toMatchObject({
      newUsers: 2,
      activeUsers: 2,
      metrics: {
        onboardingCompletionPercent: 50,
        firstLessonCompletionPercent: 50,
        todayPlanSelectionPercent: 100,
        lessonCompletionPercent: 50,
        medianMinutesToFirstLesson: 17,
        meaningfulSessionsPerActiveUser: 0.5,
      },
    });
    expect(baseline.eventCounts.lesson_started).toBe(2);
  });

  it("returns neutral baseline values when no data has been collected", () => {
    expect(calculateProductBaseline({ newUsers: [], events: [] })).toEqual({
      newUsers: 0,
      activeUsers: 0,
      metrics: {
        onboardingCompletionPercent: 0,
        firstLessonCompletionPercent: 0,
        todayPlanSelectionPercent: 0,
        lessonCompletionPercent: 0,
        medianMinutesToFirstLesson: null,
        meaningfulSessionsPerActiveUser: 0,
      },
      eventCounts: {},
    });
  });
});
