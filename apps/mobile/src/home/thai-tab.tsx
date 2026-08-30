import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { TranslationMap } from "@shellty/i18n";
import type { InterfaceLocale } from "@shellty/api-contracts";
import { colors } from "@shellty/ui";

import { speak } from "../speech";
import { SpeechRateControl, type SpeechRate } from "../ui/speech-rate-control";
import { useThaiPath, useToggleTransliteration } from "../queries/growth";
import { styles } from "./styles";

export function ThaiTab({
  token,
  locale,
  copy,
  onBack,
  onActionError,
}: {
  token: string;
  locale: InterfaceLocale;
  copy: TranslationMap;
  onBack: () => void;
  onActionError: () => void;
}) {
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1);
  const thaiQuery = useThaiPath(token, locale, true);
  const toggleTransliteration = useToggleTransliteration(token);
  const thai = thaiQuery.data;
  const backButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.learn}
      onPress={onBack}
    >
      <Text style={styles.back}>‹ {copy.learn}</Text>
    </Pressable>
  );

  if (thaiQuery.isLoading)
    return (
      <View style={styles.section}>
        {backButton}
        <ActivityIndicator color={colors.actionPrimary} />
      </View>
    );
  if (thaiQuery.isError || !thai)
    return (
      <View style={styles.section}>
        {backButton}
        <Text accessibilityRole="alert" style={styles.error}>
          {copy.noData}
        </Text>
      </View>
    );

  return (
    <View style={styles.section}>
      {backButton}
      <Text style={[styles.heading, styles.thaiText]}>{copy.thaiScript}</Text>
      <Text style={styles.disclaimer}>{thai?.disclaimer}</Text>
      <SpeechRateControl value={speechRate} onChange={setSpeechRate} />
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={copy.transliteration}
        accessibilityState={{
          checked: thai.transliterationVisible,
          disabled: toggleTransliteration.isPending,
        }}
        disabled={toggleTransliteration.isPending}
        style={styles.toggleRow}
        onPress={() => {
          toggleTransliteration.mutate(!thai.transliterationVisible, {
            onError: onActionError,
          });
        }}
      >
        <Text style={styles.cardTitle}>{copy.transliteration}</Text>
        <Text style={styles.toggle}>
          {thai.transliterationVisible ? "●" : "○"}
        </Text>
      </Pressable>
      {thai.units.map((unit) => (
        <View key={unit.id} style={styles.thaiCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unit.name}
            style={styles.audio}
            onPress={() =>
              void speak(unit.glyph, "th-TH", speechRate).catch(onActionError)
            }
          >
            <Text style={styles.audioText}>♪</Text>
          </Pressable>
          <Text style={styles.glyph}>{unit.glyph}</Text>
          <View style={styles.grow}>
            <Text style={[styles.cardTitle, styles.thaiText]}>{unit.name}</Text>
            {thai.transliterationVisible ? (
              <Text style={styles.transliteration}>
                {unit.transliteration} · {unit.tone ?? unit.toneClass ?? ""}
              </Text>
            ) : null}
            <Text style={styles.cardDetail}>{unit.meaning}</Text>
            <Text style={styles.example}>
              {unit.example.thai} · {unit.example.translation}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
