import type {
  CourseLanguage,
  InterfaceLocale,
  TodayPlanItemKind,
  TodayPlanResponse,
} from "@shellty/api-contracts";

export interface PlanInput {
  language: CourseLanguage;
  locale: InterfaceLocale;
  dailyMinutes: number;
  dueReviews: number;
  nextLesson?: { slug: string; title: string; minutes: number };
  thaiUnitsRemaining?: number;
  conversationRecommended?: boolean;
  completedItems?: number;
  completedMinutes?: number;
}

const planCopy = {
  pl: {
    reviewTitle: "Powtórka słów",
    reviewDetail: (count: number) => `${count} elementów czeka na utrwalenie`,
    lessonDetail: "Następna lekcja dopasowana do Twojego poziomu",
    thaiTitle: "Alfabet i tony",
    thaiDetail: "Krótki trening rozpoznawania znaków i tonów",
    conversationTitle: "Rozmowa praktyczna",
    conversationDetail: "Bezpieczna rozmowa tekstowa z korektą",
    fallbackTitle: "Przejrzyj lekcje",
    fallbackDetail: "Wybierz opublikowaną lekcję albo wróć do powtórek",
  },
  en: {
    reviewTitle: "Word review",
    reviewDetail: (count: number) => `${count} items are ready for review`,
    lessonDetail: "The next lesson matched to your level",
    thaiTitle: "Script and tones",
    thaiDetail: "A short character and tone recognition practice",
    conversationTitle: "Practical conversation",
    conversationDetail: "A guided text conversation with corrections",
    fallbackTitle: "Browse lessons",
    fallbackDetail: "Choose a published lesson or return to your reviews",
  },
  th: {
    reviewTitle: "ทบทวนคำศัพท์",
    reviewDetail: (count: number) => `มี ${count} รายการพร้อมทบทวน`,
    lessonDetail: "บทเรียนถัดไปที่เหมาะกับระดับของคุณ",
    thaiTitle: "อักษรและวรรณยุกต์",
    thaiDetail: "ฝึกจำตัวอักษรและเสียงวรรณยุกต์แบบสั้น",
    conversationTitle: "บทสนทนาใช้งานจริง",
    conversationDetail: "บทสนทนาข้อความพร้อมคำแนะนำแก้ไข",
    fallbackTitle: "ดูบทเรียน",
    fallbackDetail: "เลือกบทเรียนที่เผยแพร่แล้วหรือกลับไปทบทวน",
  },
} as const;

const minutesFor = (remaining: number, preferred: number): number =>
  Math.max(1, Math.min(remaining, preferred));

export function buildTodayPlan(input: PlanInput): TodayPlanResponse {
  const copy = planCopy[input.locale];
  const budget = Math.max(5, Math.min(input.dailyMinutes, 60));
  const completedMinutes = Math.max(0, Math.floor(input.completedMinutes ?? 0));
  let remaining = Math.max(0, budget - completedMinutes);
  const items: TodayPlanResponse["items"] = [];
  const add = (
    kind: TodayPlanItemKind,
    id: string,
    title: string,
    detail: string,
    preferredMinutes: number,
    action: string,
  ) => {
    if (remaining <= 0) return;
    const minutes = minutesFor(remaining, preferredMinutes);
    items.push({ id, kind, title, detail, minutes, completed: false, action });
    remaining -= minutes;
  };

  if (input.dueReviews > 0)
    add(
      "review",
      "due-reviews",
      copy.reviewTitle,
      copy.reviewDetail(input.dueReviews),
      Math.min(6, Math.max(3, input.dueReviews)),
      "reviews",
    );
  if (input.nextLesson)
    add(
      "lesson",
      `lesson:${input.nextLesson.slug}`,
      input.nextLesson.title,
      copy.lessonDetail,
      input.nextLesson.minutes,
      `lesson:${input.nextLesson.slug}`,
    );
  if (input.language === "th" && (input.thaiUnitsRemaining ?? 0) > 0)
    add("thai", "thai-script", copy.thaiTitle, copy.thaiDetail, 4, "thai");
  if (input.conversationRecommended !== false)
    add(
      "conversation",
      "conversation",
      copy.conversationTitle,
      copy.conversationDetail,
      5,
      "conversation",
    );

  if (items.length === 0 && remaining > 0)
    add(
      "lesson",
      "fallback-lessons",
      copy.fallbackTitle,
      copy.fallbackDetail,
      budget,
      "learn",
    );

  return {
    language: input.language,
    generatedBy: "deterministic",
    dailyMinutes: budget,
    totalMinutes: items.reduce((sum, item) => sum + item.minutes, 0),
    completedItems: Math.max(0, Math.floor(input.completedItems ?? 0)),
    completedMinutes,
    items,
  };
}

const dateParts = (instant: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
};

const localMidnight = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
): Date => {
  const target = Date.UTC(year, month - 1, day);
  let candidate = target;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const observed = dateParts(new Date(candidate), timeZone);
    const observedSerial = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    candidate += target - observedSerial;
  }
  return new Date(candidate);
};

/** UTC bounds for the learner's current calendar day, including DST changes. */
export function localDayBounds(
  instant: Date,
  timeZone: string,
): { start: Date; end: Date } {
  let today;
  try {
    today = dateParts(instant, timeZone);
  } catch {
    today = dateParts(instant, "UTC");
    timeZone = "UTC";
  }
  const nextDate = new Date(
    Date.UTC(today.year, today.month - 1, today.day + 1),
  );
  return {
    start: localMidnight(today.year, today.month, today.day, timeZone),
    end: localMidnight(
      nextDate.getUTCFullYear(),
      nextDate.getUTCMonth() + 1,
      nextDate.getUTCDate(),
      timeZone,
    ),
  };
}

export function calculateStreak(eventDates: Date[], now: Date): number {
  const days = new Set(
    eventDates.map((date) => date.toISOString().slice(0, 10)),
  );
  const cursor = new Date(now);
  cursor.setUTCHours(0, 0, 0, 0);
  if (!days.has(cursor.toISOString().slice(0, 10)))
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}
