import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import type { LearningIntent } from "../learning-intent";
import { useTodayPlan } from "../queries/growth";
import { sendTelemetry } from "../queries/release";
import { StatePanel } from "../ui/state-panel";
import type { Tab } from "./types";
import { styles } from "./styles";

export function TodayTab({
  token,
  language,
  locale,
  copy,
  aiAvailable,
  onOpenThai,
  onSelectTab,
  onStartLearning,
}: {
  token: string;
  language: CourseLanguage;
  locale: InterfaceLocale;
  copy: TranslationMap;
  aiAvailable: boolean;
  onOpenThai: () => void;
  onSelectTab: (tab: Tab) => void;
  onStartLearning: (intent: LearningIntent) => void;
}) {
  const planQuery = useTodayPlan(token, language, locale);
  const plan = planQuery.data;
  const trackedPlan = useRef<string | null>(null);

  useEffect(() => {
    if (!plan) return;
    const fingerprint = `${plan.language}:${plan.items.map((item) => item.id).join(",")}`;
    if (trackedPlan.current === fingerprint) return;
    trackedPlan.current = fingerprint;
    sendTelemetry(token, "today_plan_viewed", {
      language,
      itemCount: plan.items.length,
      completedItems: plan.completedItems,
      completedMinutes: plan.completedMinutes,
      dailyMinutes: plan.dailyMinutes,
      totalMinutes: plan.totalMinutes,
    });
  }, [language, plan, token]);

  if (planQuery.isLoading && !plan)
    return (
      <StatePanel
        kind="loading"
        title={copy.planLoading}
        body={copy.planLoadingBody}
      />
    );
  if (planQuery.isError && !plan)
    return (
      <StatePanel
        kind="error"
        title={copy.planErrorTitle}
        body={copy.planErrorBody}
        actionLabel={copy.retry}
        onAction={() => void planQuery.refetch()}
      />
    );

  const items = plan?.items ?? [];
  const remainingItems = items.filter((item) => !item.completed);
  const recommended = remainingItems[0];
  const nextItems = remainingItems.slice(1);
  const completed = plan?.completedItems ?? 0;
  const completedMinutes = plan?.completedMinutes ?? 0;
  const dailyMinutes = plan?.dailyMinutes ?? 1;
  const progressPercent = Math.round(
    (Math.min(completedMinutes, dailyMinutes) / Math.max(1, dailyMinutes)) *
      100,
  );

  const selectItem = (item: (typeof items)[number], position: number) => {
    sendTelemetry(token, "today_plan_item_selected", {
      language,
      kind: item.kind,
      position,
      minutes: item.minutes,
    });
    if (item.action === "thai") {
      onOpenThai();
      return;
    }
    if (item.action === "conversation") {
      onSelectTab(aiAvailable ? "chat" : "learn");
      return;
    }
    const requestId = `${item.id}:${Date.now()}`;
    if (item.action === "reviews") {
      onStartLearning({ requestId, kind: "reviews" });
      return;
    }
    if (item.action.startsWith("lesson:")) {
      onStartLearning({
        requestId,
        kind: "lesson",
        lessonSlug: item.action.slice("lesson:".length),
      });
      return;
    }
    onStartLearning({ requestId, kind: "browse" });
  };

  return (
    <View style={styles.section}>
      <View style={styles.todayOverview}>
        <View style={styles.todayOverviewRow}>
          <View style={styles.grow}>
            <Text style={styles.todayCourse}>
              {language === "th" ? copy.thaiName : copy.englishName}
            </Text>
            <Text style={styles.todayOverviewTitle}>{copy.plan}</Text>
            <Text style={styles.todayOverviewText}>{copy.ready}</Text>
          </View>
          <View style={styles.todayProgressBadge}>
            <Text style={styles.todayProgressValue}>{progressPercent}%</Text>
          </View>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: Math.max(1, dailyMinutes),
            now: Math.min(completedMinutes, dailyMinutes),
          }}
          style={styles.todayProgressTrack}
        >
          <View
            style={[
              styles.todayProgressFill,
              {
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.todayOverviewMeta}>
          {completedMinutes}/{dailyMinutes} {copy.minutesShort} · {completed}{" "}
          {copy.completedSuffix}
        </Text>
      </View>
      {recommended ? (
        <View style={styles.recommendedCard}>
          <Text style={styles.recommendedEyebrow}>{copy.recommendedNow}</Text>
          <Text style={styles.recommendedTitle}>{recommended.title}</Text>
          <Text style={styles.recommendedText}>{recommended.detail}</Text>
          <Text style={styles.recommendedMeta}>
            {recommended.minutes} {copy.minutesShort}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${copy.startSession}: ${recommended.title}, ${recommended.minutes} ${copy.minutesShort}`}
            style={({ pressed }) => [
              styles.recommendedButton,
              pressed && styles.recommendedButtonPressed,
            ]}
            onPress={() => selectItem(recommended, 1)}
          >
            <Text style={styles.recommendedButtonText}>
              {copy.startSession}
            </Text>
          </Pressable>
        </View>
      ) : (
        <StatePanel
          kind="success"
          title={copy.todayCompleteTitle}
          body={copy.todayCompleteBody}
          actionLabel={copy.learn}
          onAction={() =>
            onStartLearning({
              requestId: `extra:${Date.now()}`,
              kind: "browse",
            })
          }
        />
      )}
      {nextItems.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>{copy.nextUp}</Text>
          {nextItems.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.detail}. ${item.minutes} ${copy.minutesShort}`}
              style={styles.planCard}
              onPress={() => selectItem(item, index + 2)}
            >
              <View style={styles.planIcon}>
                <Text style={styles.planIconText}>
                  {item.kind === "review"
                    ? "↻"
                    : item.kind === "conversation"
                      ? "✦"
                      : item.kind === "thai"
                        ? "ก"
                        : "▶"}
                </Text>
              </View>
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.minutes}>
                {item.minutes} {copy.minutesShort} ›
              </Text>
            </Pressable>
          ))}
        </>
      ) : null}
    </View>
  );
}
