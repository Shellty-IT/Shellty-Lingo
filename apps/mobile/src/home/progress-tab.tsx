import { ActivityIndicator, Text, View } from "react-native";
import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { useProgress } from "../queries/growth";
import { Metric } from "./shared";
import { styles } from "./styles";

export function ProgressTab({
  token,
  language,
  locale,
  copy,
}: {
  token: string;
  language: CourseLanguage;
  locale: InterfaceLocale;
  copy: TranslationMap;
}) {
  const progressQuery = useProgress(token, language, locale);
  const progress = progressQuery.data;

  if (progressQuery.isLoading)
    return <ActivityIndicator color={colors.actionPrimary} />;
  if (progressQuery.isError && !progress)
    return <Text style={styles.error}>{copy.noData}</Text>;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{copy.progress}</Text>
      <View style={styles.levelCard}>
        <Text style={styles.levelLabel}>
          {language.toUpperCase()} · {progress?.level}
        </Text>
        <Text style={styles.levelNumber}>
          {progress?.metrics.weeklyMinutes ?? 0}/
          {progress?.metrics.weeklyGoalMinutes ?? 0}
        </Text>
        <Text style={styles.cardDetail}>{copy.metrics} · min</Text>
      </View>
      <View style={styles.metricGrid}>
        <Metric
          value={progress?.metrics.streakDays ?? 0}
          label={copy.streakDays}
          icon="🔥"
        />
        <Metric
          value={progress?.metrics.accuracyPercent ?? 0}
          label={copy.accuracy}
          icon="◎"
        />
        <Metric
          value={progress?.metrics.lessonsCompleted ?? 0}
          label={copy.lessonsMetric}
          icon="✓"
        />
        <Metric
          value={progress?.metrics.wordsLearned ?? 0}
          label={copy.wordsMetric}
          icon="▣"
        />
      </View>
      <Text style={styles.sectionLabel}>{copy.sevenDays}</Text>
      <View style={styles.chart}>
        {progress?.lastSevenDays.map((day) => (
          <View key={day.date} style={styles.barColumn}>
            <View
              style={[
                styles.bar,
                { height: Math.max(5, Math.min(80, day.minutes * 4)) },
              ]}
            />
            <Text style={styles.barLabel}>{day.date.slice(8)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.info}>
        <Text style={styles.cardTitle}>{copy.explanation}</Text>
        <Text style={styles.cardDetail}>{progress?.explanation}</Text>
      </View>
      <Text style={styles.sectionLabel}>{copy.badges}</Text>
      {progress?.badges.map((badge) => (
        <View key={badge.id} style={styles.badge}>
          <Text style={styles.badgeIcon}>{badge.earned ? "★" : "☆"}</Text>
          <Text style={styles.cardTitle}>{badge.title}</Text>
        </View>
      ))}
    </View>
  );
}
