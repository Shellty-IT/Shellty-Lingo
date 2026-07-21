import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { useTodayPlan } from "../queries/growth";
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
}: {
  token: string;
  language: CourseLanguage;
  locale: InterfaceLocale;
  copy: TranslationMap;
  aiAvailable: boolean;
  onOpenThai: () => void;
  onSelectTab: (tab: Tab) => void;
}) {
  const planQuery = useTodayPlan(token, language, locale);
  const plan = planQuery.data;

  if (planQuery.isLoading)
    return <ActivityIndicator color={colors.actionPrimary} />;
  if (planQuery.isError && !plan)
    return <Text style={styles.error}>{copy.noData}</Text>;

  return (
    <View style={styles.section}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>
          {language === "th" ? `🇹🇭 ${copy.thaiName}` : `🇬🇧 ${copy.englishName}`}
        </Text>
        <Text style={styles.heroTitle}>{copy.plan}</Text>
        <Text style={styles.heroText}>{copy.ready}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${plan ? Math.round((plan.completedItems / Math.max(1, plan.items.length)) * 100) : 0}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.heroMeta}>
          {plan?.completedItems ?? 0}/{plan?.items.length ?? 0}{" "}
          {copy.completedSuffix} · {plan?.totalMinutes ?? 0} min
        </Text>
      </View>
      {plan?.items.map((item, index) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.detail}. ${item.minutes} min`}
          style={[styles.planCard, index === 0 && styles.planCardActive]}
          onPress={() => {
            if (item.action === "thai") onOpenThai();
            else if (item.action === "conversation")
              onSelectTab(aiAvailable ? "chat" : "learn");
            else onSelectTab("learn");
          }}
        >
          <View style={[styles.planIcon, index === 0 && styles.planIconActive]}>
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
          <Text style={styles.minutes}>{item.minutes} min ›</Text>
        </Pressable>
      ))}
    </View>
  );
}
