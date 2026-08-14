import { Text, View } from "react-native";
import type { AdvancedExamResult } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton } from "./shared";
import { styles } from "./styles";

export function AdvancedExamResultView({
  result,
  copy,
  onContinue,
}: {
  result: AdvancedExamResult;
  copy: TranslationMap;
  onContinue: () => void;
}) {
  return (
    <View style={styles.summary}>
      <Text style={styles.celebration}>{result.passed ? "🎉" : "📚"}</Text>
      <View style={styles.summaryCircle}>
        <Text style={styles.summaryScore}>{result.score}%</Text>
      </View>
      <Text style={styles.title}>{result.notification.title}</Text>
      <Text style={styles.detail}>{result.notification.message}</Text>
      <Text style={styles.optionTitle}>
        {result.correct}/{result.total} · {copy.levelLabel} {result.level}
      </Text>
      <PrimaryButton label={copy.continue} onPress={onContinue} />
    </View>
  );
}
