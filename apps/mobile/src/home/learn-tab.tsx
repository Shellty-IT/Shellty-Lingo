import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { CourseLanguage } from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";

import type { LearningIntent } from "../learning-intent";
import { LearningFlow } from "../learning-flow";
import { styles } from "./styles";

export function LearnTab({
  token,
  locale,
  language,
  copy,
  listeningAvailable,
  onOpenThai,
  onOpenListening,
  initialIntent,
  onIntentHandled,
  onFocusedChange,
  onAnswerFocus,
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  copy: TranslationMap;
  listeningAvailable: boolean;
  onOpenThai: () => void;
  onOpenListening: () => void;
  initialIntent: LearningIntent | null;
  onIntentHandled: () => void;
  onFocusedChange: (focused: boolean) => void;
  onAnswerFocus: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const handleFocusedChange = useCallback(
    (next: boolean) => {
      setFocused(next);
      onFocusedChange(next);
    },
    [onFocusedChange],
  );

  return (
    <View style={styles.section}>
      {!focused && language === "th" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.thaiScript}
          style={styles.thaiBanner}
          onPress={onOpenThai}
        >
          <Text style={styles.thaiGlyph}>ก</Text>
          <View style={styles.grow}>
            <Text style={styles.cardTitle}>{copy.thaiScript}</Text>
            <Text style={styles.cardDetail}>{copy.thaiScriptDetail}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ) : null}
      {!focused && listeningAvailable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.listening}
          style={styles.listeningBanner}
          onPress={onOpenListening}
        >
          <View style={styles.listeningIcon}>
            <Text style={styles.listeningIconText}>▶</Text>
          </View>
          <View style={styles.grow}>
            <Text style={styles.cardTitle}>{copy.listening}</Text>
            <Text style={styles.cardDetail}>{copy.listeningBody}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      ) : null}
      <LearningFlow
        token={token}
        locale={locale}
        preferredLanguage={language}
        initialIntent={initialIntent}
        onIntentHandled={onIntentHandled}
        onFocusedChange={handleFocusedChange}
        onAnswerFocus={onAnswerFocus}
      />
    </View>
  );
}
