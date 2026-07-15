import { describe, expect, it } from "vitest";
import {
  isQuietTime,
  isValidTimezone,
  shouldQueueNotification,
  zonedClock,
} from "./operations-engine";

describe("notification scheduling", () => {
  it("uses the learner timezone across a daylight-saving boundary", () => {
    expect(
      zonedClock(new Date("2026-03-29T17:00:00Z"), "Europe/Warsaw"),
    ).toMatchObject({ time: "19:00", date: "2026-03-29" });
  });

  it("suppresses reminders during overnight quiet hours", () => {
    expect(isQuietTime("23:30", "22:00", "07:00")).toBe(true);
    expect(isQuietTime("06:59", "22:00", "07:00")).toBe(true);
    expect(isQuietTime("12:00", "22:00", "07:00")).toBe(false);
  });

  it("queues only an enabled preference at the configured local minute", () => {
    expect(
      shouldQueueNotification(new Date("2026-07-14T17:00:00Z"), {
        enabled: true,
        localTime: "19:00",
        timezone: "Europe/Warsaw",
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      }).queue,
    ).toBe(true);
  });

  it("allows a short scheduler delay without sending stale reminders", () => {
    const preference = {
      enabled: true,
      localTime: "19:00",
      timezone: "Europe/Warsaw",
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
    };
    expect(
      shouldQueueNotification(new Date("2026-07-14T17:07:00Z"), preference)
        .queue,
    ).toBe(true);
    expect(
      shouldQueueNotification(new Date("2026-07-14T17:15:00Z"), preference)
        .queue,
    ).toBe(false);
  });

  it("rejects unknown IANA timezones", () => {
    expect(isValidTimezone("Europe/Warsaw")).toBe(true);
    expect(isValidTimezone("Mars/Olympus")).toBe(false);
  });
});
