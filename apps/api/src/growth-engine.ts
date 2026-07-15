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
  let remaining = budget;
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

  if (items.length === 0)
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
    completedItems: 0,
    items,
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
