import { useEffect, useRef, type ReactNode } from "react";
import { AccessibilityInfo, findNodeHandle, Text, View } from "react-native";
import type { InterfaceLocale, LearnerExercise } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { styles } from "./styles";

export function ExerciseFrame({
  exercise,
  locale,
  copy,
  instruction,
  children,
}: {
  exercise: LearnerExercise;
  locale: InterfaceLocale;
  copy: TranslationMap;
  instruction: string;
  children: ReactNode;
}) {
  const heading = useRef<Text>(null);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const tag = heading.current ? findNodeHandle(heading.current) : null;
      if (tag)
        void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
          if (enabled && active) AccessibilityInfo.setAccessibilityFocus(tag);
        });
    }, 100);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [exercise.id]);
  const count = exercise.responseConstraints?.selectionCount;
  return (
    <View style={styles.flow}>
      <Text
        ref={heading}
        accessible
        accessibilityRole="header"
        style={styles.exerciseInstruction}
      >
        {instruction}
      </Text>
      {exercise.learningObjective ? (
        <Text style={styles.detail}>{exercise.learningObjective}</Text>
      ) : null}
      {count ? (
        <Text style={styles.detail}>
          {copy.selectionCount.replace("{count}", String(count))}
        </Text>
      ) : null}
      {exercise.instructions &&
      (exercise.instructionsLocale ?? "en") !== locale ? (
        <Text style={styles.detail}>
          {copy.originalInstruction}: {exercise.instructions}
        </Text>
      ) : null}
      {exercise.answerLanguage &&
      (exercise.type === "gap_fill" ||
        exercise.type === "typed_answer" ||
        exercise.type === "ordering") ? (
        <Text style={styles.detail}>
          {copy.answerLanguageLabel}:{" "}
          {exercise.answerLanguage === "en" ? copy.english : copy.thai}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
