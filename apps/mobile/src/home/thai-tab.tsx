import { Pressable, Text, View } from "react-native";
import type { TranslationMap } from "@shellty/i18n";

import { speak } from "../speech";
import { useThaiPath, useToggleTransliteration } from "../queries/growth";
import { styles } from "./styles";

export function ThaiTab({
  token,
  copy,
  onBack,
}: {
  token: string;
  copy: TranslationMap;
  onBack: () => void;
}) {
  const thaiQuery = useThaiPath(token, true);
  const toggleTransliteration = useToggleTransliteration(token);
  const thai = thaiQuery.data;

  return (
    <View style={styles.section}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.learn}
        onPress={onBack}
      >
        <Text style={styles.back}>‹ {copy.learn}</Text>
      </Pressable>
      <Text style={[styles.heading, styles.thaiText]}>{copy.thaiScript}</Text>
      <Text style={styles.disclaimer}>{thai?.disclaimer}</Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={copy.transliteration}
        accessibilityState={{ checked: thai?.transliterationVisible }}
        style={styles.toggleRow}
        onPress={() => {
          if (!thai) return;
          toggleTransliteration.mutate(!thai.transliterationVisible);
        }}
      >
        <Text style={styles.cardTitle}>{copy.transliteration}</Text>
        <Text style={styles.toggle}>
          {thai?.transliterationVisible ? "●" : "○"}
        </Text>
      </Pressable>
      {thai?.units.map((unit) => (
        <View key={unit.id} style={styles.thaiCard}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={unit.name}
            style={styles.audio}
            onPress={() => void speak(unit.glyph, "th-TH", 0.8)}
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
