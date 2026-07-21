import { Text, View } from "react-native";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton } from "./shared";
import { styles } from "./styles";

export function SummaryView({
  summaryScore,
  copy,
  onContinue,
}: {
  summaryScore: number;
  copy: TranslationMap;
  onContinue: () => void;
}) {
  return (
    <View style={styles.summary}>
      <View style={styles.summaryCircle}>
        <Text style={styles.summaryScore}>
          {Math.round(summaryScore * 100)}%
        </Text>
      </View>
      <Text style={styles.title}>{copy.lessonComplete}</Text>
      <Text style={styles.detail}>{copy.score}</Text>
      <PrimaryButton label={copy.continue} onPress={onContinue} />
    </View>
  );
}
