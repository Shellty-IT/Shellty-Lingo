import { describe, expect, it } from "vitest";
import {
  buildTodayPlan,
  calculateStreak,
  localDayBounds,
  localDayRange,
} from "./growth-engine";

describe("personalized plan engine", () => {
  it("prioritizes overdue reviews and never exceeds the daily budget", () => {
    const plan = buildTodayPlan({
      language: "th",
      locale: "pl",
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
      locale: "en",
      dailyMinutes: 5,
      dueReviews: 0,
    });
    expect(plan.items.length).toBeGreaterThan(0);
    expect(plan.generatedBy).toBe("deterministic");
  });

  it("uses completed learning minutes before recommending more work", () => {
    const plan = buildTodayPlan({
      language: "en",
      locale: "pl",
      dailyMinutes: 15,
      dueReviews: 4,
      completedItems: 2,
      completedMinutes: 15,
    });

    expect(plan.completedItems).toBe(2);
    expect(plan.completedMinutes).toBe(15);
    expect(plan.items).toEqual([]);
  });

  it("calculates the learner's local day across a summer UTC offset", () => {
    const bounds = localDayBounds(
      new Date("2026-07-14T12:00:00.000Z"),
      "Europe/Warsaw",
    );

    expect(bounds.start.toISOString()).toBe("2026-07-13T22:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-07-14T22:00:00.000Z");
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

  it("counts streaks by the learner's calendar date", () => {
    expect(
      calculateStreak(
        [new Date("2026-07-12T22:30:00Z"), new Date("2026-07-13T22:30:00Z")],
        new Date("2026-07-14T21:00:00Z"),
        "Europe/Warsaw",
      ),
    ).toBe(2);
  });

  it("builds a seven-day range with local calendar labels", () => {
    const range = localDayRange(
      new Date("2026-07-14T21:00:00Z"),
      "Europe/Warsaw",
      7,
    );

    expect(range.keys).toEqual([
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
      "2026-07-13",
      "2026-07-14",
    ]);
    expect(range.start.toISOString()).toBe("2026-07-07T22:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-07-14T22:00:00.000Z");
  });
});
