import { Pressable, Text, View } from "react-native";
import type { PlacementSessionResponse } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { speak } from "../speech";
import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";

export function PlacementView({
  placement,
  index,
  selected,
  copy,
  onSelect,
  onNext,
  onSkip,
  onAudioError,
  allowSkip = true,
  badge,
  disabled = false,
}: {
  placement: PlacementSessionResponse;
  index: number;
  selected: Record<string, string>;
  copy: TranslationMap;
  onSelect: (questionId: string, optionId: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onAudioError: () => void;
  allowSkip?: boolean;
  badge?: string;
  disabled?: boolean;
}) {
  const question = placement.questions[index];
  if (!question) return null;
  return (
    <View style={styles.flow}>
      <View style={styles.progressHeader}>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: placement.questions.length,
            now: index + 1,
          }}
          style={styles.progressTrack}
        >
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
      <Text style={styles.badge}>{badge ?? copy.placementBadge}</Text>
      <Text style={styles.title}>{question.prompt}</Text>
      {question.skill === "listening" && question.audioText ? (
        <SmallButton
          label={`🔊 ${copy.listen}`}
          onPress={() =>
            void speak(question.audioText!, placement.language, 0.9).catch(
              onAudioError,
            )
          }
        />
      ) : null}
      <View style={styles.options}>
        {question.options.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={option.text}
            accessibilityState={{
              checked: selected[question.id] === option.id,
              disabled,
            }}
            disabled={disabled}
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
        disabled={disabled || !selected[question.id]}
      />
      {allowSkip ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.skipTest}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onSkip}
          style={styles.skip}
        >
          <Text style={styles.detail}>{copy.skipTest}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
