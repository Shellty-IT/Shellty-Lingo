import { describe, expect, it } from "vitest";
import { buildTodayPlan, calculateStreak } from "./growth-engine";

describe("personalized plan engine", () => {
  it("prioritizes overdue reviews and never exceeds the daily budget", () => {
    const plan = buildTodayPlan({
      language: "th",
      dailyMinutes: 15,
      dueReviews: 4,
      nextLesson: {
        slug: "first-thai-letters",
        title: "Pierwsze znaki",
        minutes: 7,
      },
      thaiUnitsRemaining: 12,
    });
    expect(plan.items[0]?.kind).toBe("review");
    expect(plan.totalMinutes).toBeLessThanOrEqual(15);
    expect(plan.items.some((item) => item.kind === "thai")).toBe(true);
  });

  it("always returns a deterministic fallback", () => {
    const plan = buildTodayPlan({
      language: "en",
      dailyMinutes: 5,
      dueReviews: 0,
    });
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.generatedBy).toBe("deterministic");
  });

  it("counts a continuous streak ending yesterday", () => {
    expect(
      calculateStreak(
        [
          new Date("2026-07-11T10:00:00Z"),
          new Date("2026-07-12T10:00:00Z"),
          new Date("2026-07-13T10:00:00Z"),
        ],
        new Date("2026-07-14T08:00:00Z"),
      ),
    ).toBe(3);
  });
});
