import type {
  CourseLanguage,
  TodayPlanItemKind,
  TodayPlanResponse,
} from "@shellty/api-contracts";

export interface PlanInput {
  language: CourseLanguage;
  dailyMinutes: number;
  dueReviews: number;
  nextLesson?: { slug: string; title: string; minutes: number };
  thaiUnitsRemaining?: number;
  conversationRecommended?: boolean;
}

const minutesFor = (remaining: number, preferred: number): number =>
  Math.max(1, Math.min(remaining, preferred));

export function buildTodayPlan(input: PlanInput): TodayPlanResponse {
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
      "Powtórka słów",
      `${input.dueReviews} elementów czeka na utrwalenie`,
      Math.min(6, Math.max(3, input.dueReviews)),
      "reviews",
    );
  if (input.nextLesson)
    add(
      "lesson",
      `lesson:${input.nextLesson.slug}`,
      input.nextLesson.title,
      "Następna lekcja dopasowana do Twojego poziomu",
      input.nextLesson.minutes,
      `lesson:${input.nextLesson.slug}`,
    );
  if (input.language === "th" && (input.thaiUnitsRemaining ?? 0) > 0)
    add(
      "thai",
      "thai-script",
      "Alfabet i tony",
      "Krótki trening rozpoznawania znaków i tonów",
      4,
      "thai",
    );
  if (input.conversationRecommended !== false)
    add(
      "conversation",
      "conversation",
      "Rozmowa praktyczna",
      "Bezpieczna rozmowa tekstowa z korektą",
      5,
      "conversation",
    );

  if (items.length === 0)
    add(
      "conversation",
      "fallback-conversation",
      "Krótka rozmowa",
      "Plan awaryjny dostępny bez rekomendacji AI",
      budget,
      "conversation",
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
