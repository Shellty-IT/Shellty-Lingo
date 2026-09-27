import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { LearnerExercise } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";
import { optionMark, pairMark, type AnswerMark } from "./lesson-presentation";
import { SmallButton } from "./shared";
import { styles } from "./styles";

type Props = {
  exercise: LearnerExercise;
  copy: TranslationMap;
  locked: boolean;
  expected?: unknown;
  selected: string[];
  onSelected: (ids: string[]) => void;
  typedAnswer: string;
  onTypedAnswer: (text: string) => void;
  pairs: Record<string, string>;
  onPairs: (pairs: Record<string, string>) => void;
  activeLeft: string | null;
  onActiveLeft: (id: string | null) => void;
  onAnswerFocus: (input?: TextInput | null) => void;
  onSubmit: () => void;
};
const markText = (mark: AnswerMark, copy: TranslationMap) =>
  mark === "correct"
    ? `✓ ${copy.optionCorrect}`
    : mark === "incorrect"
      ? `! ${copy.optionIncorrect}`
      : mark === "expected"
        ? `✓ ${copy.optionExpected}`
        : "";
const markStyle = (mark: AnswerMark) =>
  mark === "incorrect"
    ? styles.optionRejected
    : mark
      ? styles.optionExpected
      : null;

function ChoiceAnswer({
  exercise,
  copy,
  locked,
  expected,
  selected,
  onSelected,
}: Props) {
  const multiple = exercise.type === "multiple_choice";
  return (
    <View style={styles.options}>
      {(exercise.options ?? []).map((option) => {
        const checked = selected.includes(option.id);
        const mark =
          expected === undefined
            ? undefined
            : optionMark(exercise, selected, option.id, expected);
        return (
          <Pressable
            key={option.id}
            accessibilityRole={multiple ? "checkbox" : "radio"}
            accessibilityLabel={`${option.text}${mark ? `, ${markText(mark, copy)}` : ""}`}
            accessibilityState={{
              checked,
              selected: checked,
              disabled: locked,
            }}
            disabled={locked}
            onPress={() =>
              onSelected(
                multiple
                  ? checked
                    ? selected.filter((id) => id !== option.id)
                    : [...selected, option.id]
                  : [option.id],
              )
            }
            style={[
              styles.option,
              checked && styles.optionSelected,
              markStyle(mark),
            ]}
          >
            <Text style={styles.optionTitle}>
              {multiple ? `${checked ? "☑" : "☐"} ` : ""}
              {option.text}
            </Text>
            {mark ? (
              <Text style={styles.detail}>{markText(mark, copy)}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function OrderingAnswer(props: Props) {
  const { exercise, copy, locked, expected, selected, onSelected } = props;
  const options = exercise.options ?? [];
  const move = (index: number, offset: number) => {
    if (locked || index + offset < 0 || index + offset >= selected.length)
      return;
    const next = [...selected];
    [next[index], next[index + offset]] = [next[index + offset]!, next[index]!];
    onSelected(next);
  };
  return (
    <View style={styles.options}>
      <Text style={styles.answerPreviewLabel}>{copy.yourSentence}</Text>
      {selected.map((id, index) => {
        const option = options.find((item) => item.id === id);
        if (!option) return null;
        const text = option.displayText ?? option.text;
        const mark =
          expected === undefined
            ? undefined
            : optionMark(exercise, selected, id, expected);
        const position = copy.orderingPosition.replace(
          "{position}",
          String(index + 1),
        );
        return (
          <View key={id} style={[styles.option, markStyle(mark)]}>
            <Text
              accessibilityLabel={`${position}, ${text}${mark ? `, ${markText(mark, copy)}` : ""}`}
              style={styles.optionTitle}
            >
              {index + 1}. {text}
            </Text>
            {mark ? (
              <Text style={styles.detail}>{markText(mark, copy)}</Text>
            ) : null}
            {!locked ? (
              <View style={styles.listeningActions}>
                <SmallButton
                  label={copy.orderingMoveEarlier}
                  accessibilityLabel={`${copy.orderingMoveEarlier}: ${text}`}
                  disabled={index === 0}
                  onPress={() => move(index, -1)}
                />
                <SmallButton
                  label={copy.orderingMoveLater}
                  accessibilityLabel={`${copy.orderingMoveLater}: ${text}`}
                  disabled={index === selected.length - 1}
                  onPress={() => move(index, 1)}
                />
                <SmallButton
                  label={copy.orderingRemove}
                  accessibilityLabel={`${copy.orderingRemove}: ${text}`}
                  onPress={() =>
                    onSelected(selected.filter((item) => item !== id))
                  }
                />
              </View>
            ) : null}
          </View>
        );
      })}
      {options
        .filter((option) => !selected.includes(option.id))
        .map((option) => (
          <SmallButton
            key={option.id}
            label={option.displayText ?? option.text}
            disabled={locked}
            onPress={() => onSelected([...selected, option.id])}
          />
        ))}
    </View>
  );
}

function MatchingAnswer({
  exercise,
  copy,
  locked,
  expected,
  pairs,
  onPairs,
  activeLeft,
  onActiveLeft,
}: Props) {
  const matching = exercise.matching;
  if (!matching) return null;
  return (
    <View style={styles.options}>
      <Text style={styles.eyebrow}>{copy.matchingChooseLeft}</Text>
      {matching.left.map((option) => {
        const right = matching.right.find(
          (item) => item.id === pairs[option.id],
        );
        const mark =
          expected === undefined
            ? undefined
            : pairMark(option.id, right?.id, expected);
        const text = `${option.text}${right ? ` → ${right.text}` : ""}`;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            disabled={locked}
            accessibilityLabel={`${text}${mark ? `, ${markText(mark, copy)}` : ""}`}
            accessibilityState={{
              selected: activeLeft === option.id,
              disabled: locked,
            }}
            onPress={() =>
              onActiveLeft(activeLeft === option.id ? null : option.id)
            }
            style={[
              styles.option,
              activeLeft === option.id && styles.optionSelected,
              markStyle(mark),
            ]}
          >
            <Text style={styles.optionTitle}>{text}</Text>
            {mark ? (
              <Text style={styles.detail}>{markText(mark, copy)}</Text>
            ) : null}
          </Pressable>
        );
      })}
      <Text style={styles.eyebrow}>{copy.matchingChooseRight}</Text>
      {matching.right.map((option) => {
        const disabled = locked || !activeLeft;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            disabled={disabled}
            accessibilityLabel={option.text}
            accessibilityState={{
              selected: Object.values(pairs).includes(option.id),
              disabled,
            }}
            style={styles.option}
            onPress={() => {
              if (locked || !activeLeft) return;
              onPairs({
                ...Object.fromEntries(
                  Object.entries(pairs).filter(
                    ([left, right]) =>
                      left !== activeLeft && right !== option.id,
                  ),
                ),
                [activeLeft]: option.id,
              });
              onActiveLeft(null);
            }}
          >
            <Text style={styles.optionTitle}>{option.text}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TypedAnswer({
  exercise,
  copy,
  locked,
  typedAnswer,
  onTypedAnswer,
  onAnswerFocus,
  onSubmit,
}: Props) {
  const ref = useRef<TextInput>(null);
  return (
    <TextInput
      ref={ref}
      accessibilityLabel={copy.answerLabel}
      accessibilityHint={
        exercise.type === "gap_fill" ? copy.exerciseGap : copy.exerciseSentence
      }
      style={styles.input}
      value={typedAnswer}
      onChangeText={onTypedAnswer}
      placeholder={copy.answerPlaceholder}
      placeholderTextColor={colors.textPlaceholder}
      editable={!locked}
      multiline={exercise.type === "typed_answer"}
      autoCorrect={false}
      autoCapitalize={exercise.type === "gap_fill" ? "none" : "sentences"}
      returnKeyType={exercise.type === "gap_fill" ? "done" : "default"}
      onFocus={() => onAnswerFocus(ref.current)}
      onSubmitEditing={() => {
        if (!locked && typedAnswer.trim()) onSubmit();
      }}
    />
  );
}

export function ExerciseAnswers(props: Props) {
  switch (props.exercise.type) {
    case "single_choice":
    case "multiple_choice":
    case "listening":
      return <ChoiceAnswer {...props} />;
    case "ordering":
      return <OrderingAnswer {...props} />;
    case "matching":
      return <MatchingAnswer {...props} />;
    case "gap_fill":
    case "typed_answer":
      return props.exercise.interaction ? (
        <View style={styles.options}>
          <Text style={styles.detail}>
            {props.copy.correctionFragmentInstruction}
          </Text>
          <Text style={styles.prompt}>
            {props.exercise.interaction.before}
            <Text
              style={{ fontWeight: "700", textDecorationLine: "underline" }}
            >
              {props.exercise.interaction.fragment}
            </Text>
            {props.exercise.interaction.after}
          </Text>
          <TypedAnswer {...props} />
        </View>
      ) : (
        <TypedAnswer {...props} />
      );
  }
}
