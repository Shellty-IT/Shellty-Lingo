import { Text, View } from "react-native";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton } from "./shared";
import { styles } from "./styles";

export function SummaryView({
  summary,
  lessonTitle,
  exerciseCount,
  copy,
  onContinue,
}: {
  summary: { score: number; dueReviews: number };
  lessonTitle: string;
  exerciseCount: number;
  copy: TranslationMap;
  onContinue: () => void;
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.celebration} accessible={false}>
        ✦
      </Text>
      <Text style={styles.badge}>{copy.lessonComplete}</Text>
      <Text style={styles.summaryTitle}>{lessonTitle}</Text>
      <View style={styles.summaryCircle}>
        <Text style={styles.summaryScore}>
          {Math.round(summary.score * 100)}%
        </Text>
        <Text style={styles.summaryScoreLabel}>{copy.score}</Text>
      </View>
      <View style={styles.summaryMetrics}>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryMetricValue}>{exerciseCount}</Text>
          <Text style={styles.summaryMetricLabel}>
            {copy.exercisesCompleted}
          </Text>
        </View>
        <View style={styles.summaryMetric}>
          <Text style={styles.summaryMetricValue}>{summary.dueReviews}</Text>
          <Text style={styles.summaryMetricLabel}>{copy.reviewsReady}</Text>
        </View>
      </View>
      <PrimaryButton label={copy.backToLearning} onPress={onContinue} />
    </View>
  );
}
