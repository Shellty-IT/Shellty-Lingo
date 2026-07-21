import type {
  BetaReadinessResponse,
  FeatureFlagKey,
} from "@shellty/api-contracts";

export interface BetaUserSample {
  id: string;
  createdAt: Date;
  onboardingCompleted: boolean;
  events: Array<{ name: string; createdAt: Date }>;
}

export interface BetaMetricInput {
  users: BetaUserSample[];
  conversationReports: number;
  completedConversations: number;
  crashFreePercent?: number | null;
  now: Date;
}

const percentage = (count: number, total: number): number =>
  total === 0 ? 0 : Math.round((count / total) * 1000) / 10;

const hasEvent = (user: BetaUserSample, names: string[]): boolean =>
  user.events.some((event) => names.includes(event.name));

const retainedAfter = (
  user: BetaUserSample,
  days: number,
  now: Date,
): boolean | null => {
  const threshold = new Date(user.createdAt.getTime() + days * 86_400_000);
  if (now < threshold) return null;
  const end = new Date(threshold.getTime() + 86_400_000);
  return user.events.some(
    (event) => event.createdAt >= threshold && event.createdAt < end,
  );
};

export function featureRolloutBucket(
  userId: string,
  key: FeatureFlagKey,
): number {
  let hash = 2166136261;
  for (const character of `${key}:${userId}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

export function calculateBetaMetrics(input: BetaMetricInput) {
  const activated = input.users.filter(
    (user) =>
      user.onboardingCompleted ||
      hasEvent(user, ["onboarding_completed", "placement_completed"]),
  ).length;
  const firstLesson = input.users.filter((user) =>
    hasEvent(user, ["first_lesson_completed", "lesson_completed"]),
  ).length;
  const firstConversation = input.users.filter((user) =>
    hasEvent(user, ["first_conversation_completed", "conversation_completed"]),
  ).length;
  const retention = (days: number) => {
    const eligible = input.users
      .map((user) => retainedAfter(user, days, input.now))
      .filter((value): value is boolean => value !== null);
    return percentage(eligible.filter(Boolean).length, eligible.length);
  };
  return {
    activationPercent: percentage(activated, input.users.length),
    firstLessonCompletionPercent: percentage(firstLesson, input.users.length),
    firstConversationCompletionPercent: percentage(
      firstConversation,
      input.users.length,
    ),
    retentionD1Percent: retention(1),
    retentionD7Percent: retention(7),
    aiReportPercent: percentage(
      input.conversationReports,
      input.completedConversations,
    ),
    crashFreePercent: input.crashFreePercent ?? null,
  };
}

type Metrics = BetaReadinessResponse["metrics"];

export function buildReleaseGates(
  metrics: Metrics,
  sampleSize: number,
): Pick<BetaReadinessResponse, "gates" | "recommendation"> {
  const definitions = [
    {
      key: "sample",
      label: "Reprezentatywna próba beta",
      value: sampleSize,
      target: 30,
      unit: "users" as const,
      higherIsBetter: true,
    },
    {
      key: "activation",
      label: "Aktywacja",
      value: metrics.activationPercent,
      target: 60,
      unit: "percent" as const,
      higherIsBetter: true,
    },
    {
      key: "first_lesson",
      label: "Ukończenie pierwszej lekcji",
      value: metrics.firstLessonCompletionPercent,
      target: 55,
      unit: "percent" as const,
      higherIsBetter: true,
    },
    {
      key: "retention_d7",
      label: "Retencja D7",
      value: metrics.retentionD7Percent,
      target: 20,
      unit: "percent" as const,
      higherIsBetter: true,
    },
    {
      key: "ai_reports",
      label: "Zgłoszenia jakości AI",
      value: metrics.aiReportPercent,
      target: 5,
      unit: "percent" as const,
      higherIsBetter: false,
    },
    {
      key: "crash_free",
      label: "Sesje bez awarii",
      value: metrics.crashFreePercent,
      target: 99.5,
      unit: "percent" as const,
      higherIsBetter: true,
    },
  ];
  const gates: BetaReadinessResponse["gates"] = definitions.map((gate) => {
    if (gate.value === null) return { ...gate, status: "needs_data" as const };
    const passed = gate.higherIsBetter
      ? gate.value >= gate.target
      : gate.value <= gate.target;
    const warning = gate.higherIsBetter
      ? gate.value >= gate.target * 0.8
      : gate.value <= gate.target * 1.5;
    return {
      key: gate.key,
      label: gate.label,
      value: gate.value,
      target: gate.target,
      unit: gate.unit,
      status: passed ? "pass" : warning ? "warning" : "blocked",
    };
  });
  const hasMissing = gates.some((gate) => gate.status === "needs_data");
  const hasBlocked = gates.some((gate) => gate.status === "blocked");
  return {
    gates,
    recommendation: hasMissing ? "needs_data" : hasBlocked ? "hold" : "go",
  };
}
