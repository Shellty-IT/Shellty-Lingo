import { Text, View } from "react-native";
import { useState } from "react";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";

export function SummaryView({
  summary,
  lessonTitle,
  exerciseCount,
  copy,
  onContinue,
  onComfort,
}: {
  summary: {
    score: number;
    dueReviews: number;
    unresolvedCount?: number;
    independentlyCorrect?: number;
  };
  lessonTitle: string;
  exerciseCount: number;
  copy: TranslationMap;
  onContinue: () => void;
  onComfort?: (rating: number) => void;
}) {
  const [rated, setRated] = useState(false);
  return (
    <View style={styles.summary}>
      <Text style={styles.celebration} accessible={false}>
        ✦
      </Text>
      <Text style={styles.badge}>{copy.lessonComplete}</Text>
      <Text style={styles.summaryTitle}>{lessonTitle}</Text>
      <View style={styles.summaryCircle}>
        <Text style={styles.summaryScore}>
          {summary.unresolvedCount === exerciseCount
            ? "—"
            : `${Math.round(summary.score * 100)}%`}
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
      {summary.unresolvedCount ? (
        <Text style={styles.detail}>
          {copy.unresolvedSummary.replace(
            "{count}",
            String(summary.unresolvedCount),
          )}
        </Text>
      ) : null}
      {summary.independentlyCorrect !== undefined ? (
        <Text style={styles.detail}>
          {copy.independentSummary.replace(
            "{count}",
            String(summary.independentlyCorrect),
          )}
        </Text>
      ) : null}
      {onComfort ? (
        <View style={styles.options}>
          <Text style={styles.detail}>
            {rated ? copy.learningComfortSaved : copy.learningComfortQuestion}
          </Text>
          {!rated ? (
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <SmallButton
                  key={rating}
                  label={`${rating}/5`}
                  onPress={() => {
                    setRated(true);
                    onComfort(rating);
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <PrimaryButton label={copy.backToLearning} onPress={onContinue} />
    </View>
  );
}
