import { Pressable, Text, View } from "react-native";
import type { PlacementSessionResponse } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton } from "./shared";
import { styles } from "./styles";

export function PlacementView({
  placement,
  index,
  selected,
  copy,
  onSelect,
  onNext,
  onSkip,
}: {
  placement: PlacementSessionResponse;
  index: number;
  selected: Record<string, string>;
  copy: TranslationMap;
  onSelect: (questionId: string, optionId: string) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const question = placement.questions[index];
  if (!question) return null;
  return (
    <View style={styles.flow}>
      <View style={styles.progressHeader}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressValue,
              { width: `${((index + 1) / placement.questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.detail}>
          {index + 1}/{placement.questions.length}
        </Text>
      </View>
      <Text style={styles.badge}>{copy.placementBadge}</Text>
      <Text style={styles.title}>{question.prompt}</Text>
      <View style={styles.options}>
        {question.options.map((option) => (
          <Pressable
            key={option.id}
            style={[
              styles.option,
              selected[question.id] === option.id && styles.optionSelected,
            ]}
            onPress={() => onSelect(question.id, option.id)}
          >
            <Text style={styles.optionTitle}>{option.text}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton
        label={
          index === placement.questions.length - 1
            ? copy.checkFinish
            : copy.next
        }
        onPress={onNext}
        disabled={!selected[question.id]}
      />
      <Pressable onPress={onSkip} style={styles.skip}>
        <Text style={styles.detail}>{copy.skipTest}</Text>
      </Pressable>
    </View>
  );
}
