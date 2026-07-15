export interface ZonedClock {
  date: string;
  time: string;
  minuteOfDay: number;
}

const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const isValidTime = (value: string): boolean => timePattern.test(value);

export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function zonedClock(now: Date, timezone: string): ZonedClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    minuteOfDay: hour * 60 + minute,
  };
}

const minuteOfDay = (time: string): number => {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
};

export function isQuietTime(time: string, start: string, end: string): boolean {
  const current = minuteOfDay(time);
  const quietStart = minuteOfDay(start);
  const quietEnd = minuteOfDay(end);
  if (quietStart === quietEnd) return false;
  return quietStart < quietEnd
    ? current >= quietStart && current < quietEnd
    : current >= quietStart || current < quietEnd;
}

export function shouldQueueNotification(
  now: Date,
  preference: {
    enabled: boolean;
    localTime: string;
    timezone: string;
    quietHoursStart: string;
    quietHoursEnd: string;
  },
): { queue: boolean; localDate: string } {
  const clock = zonedClock(now, preference.timezone);
  const scheduledMinute = minuteOfDay(preference.localTime);
  const withinDeliveryWindow =
    clock.minuteOfDay >= scheduledMinute &&
    clock.minuteOfDay < scheduledMinute + 15;
  return {
    queue:
      preference.enabled &&
      withinDeliveryWindow &&
      !isQuietTime(
        clock.time,
        preference.quietHoursStart,
        preference.quietHoursEnd,
      ),
    localDate: clock.date,
  };
}
