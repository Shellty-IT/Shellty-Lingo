import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  ContextDictionaryResult,
  ExerciseAttemptResult,
  InterfaceLocale,
  LearnerExercise,
  LearningSessionResponse,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { idempotencyKey, isRetryableRequestError } from "../api";
import { queueAttempt } from "../offline-attempts";
import { speak } from "../speech";
import {
  useDictionaryLookup,
  useSaveDictionary,
  useSubmitAnswer,
} from "../queries/learning";
import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";

const answerValue = (
  exercise: LearnerExercise,
  selected: string[],
  typedAnswer: string,
  matchingPairs: Record<string, string>,
): unknown => {
  if (exercise.type === "multiple_choice" || exercise.type === "ordering")
    return selected;
  if (exercise.type === "matching") return { pairs: matchingPairs };
  if (exercise.type === "gap_fill" || exercise.type === "typed_answer")
    return typedAnswer;
  return selected[0] ?? "";
};

const dictionaryTokens = (prompt: string, language: "en" | "th"): string[] => {
  if (language === "th" && typeof Intl.Segmenter === "function")
    return [
      ...new Intl.Segmenter("th", { granularity: "word" }).segment(prompt),
    ]
      .filter((part) => part.isWordLike)
      .map((part) => part.segment);
  return prompt.match(/[\p{L}\p{M}'’]+/gu) ?? [];
};

export function LessonView({
  token,
  locale,
  copy,
  lesson,
  exerciseIndex,
  onClose,
  onAdvance,
  onMessage,
  completing,
}: {
  token: string;
  locale: InterfaceLocale;
  copy: TranslationMap;
  lesson: LearningSessionResponse;
  exerciseIndex: number;
  onClose: () => void;
  onAdvance: () => void;
  onMessage: (text: string | null) => void;
  completing: boolean;
}) {
  const currentExercise = lesson.exercises[exerciseIndex];
  const submitAnswerMutation = useSubmitAnswer(token);
  const dictionaryLookupMutation = useDictionaryLookup(token);
  const saveDictionaryMutation = useSaveDictionary(token);

  const [selected, setSelected] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>(
    {},
  );
  const [matchingLeft, setMatchingLeft] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<ExerciseAttemptResult | null>(null);
  const [dictionary, setDictionary] = useState<ContextDictionaryResult | null>(
    null,
  );
  const [dictionarySaved, setDictionarySaved] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  // Reset per-exercise state whenever the active exercise (or the lesson
  // session itself) changes, matching the previous resetAnswer() call sites.
  useEffect(() => {
    setSelected([]);
    setTypedAnswer("");
    setMatchingPairs({});
    setMatchingLeft(null);
    setFeedback(null);
    setDictionary(null);
    setDictionarySaved(false);
  }, [exerciseIndex, lesson.sessionId]);

  if (!currentExercise) return null;

  const submitAnswer = () => {
    const answer = answerValue(
      currentExercise,
      selected,
      typedAnswer,
      matchingPairs,
    );
    const key = idempotencyKey("answer", lesson.sessionId, currentExercise.id);
    onMessage(null);
    submitAnswerMutation.mutate(
      {
        sessionId: lesson.sessionId,
        exerciseId: currentExercise.id,
        answer,
        idempotencyKey: key,
      },
      {
        onSuccess: (result) => setFeedback(result),
        onError: async (reason) => {
          if (isRetryableRequestError(reason)) {
            await queueAttempt({
              sessionId: lesson.sessionId,
              exerciseId: currentExercise.id,
              answer,
              idempotencyKey: key,
            });
            onMessage(copy.offlineProgress);
          } else onMessage(copy.answerRejected);
        },
      },
    );
  };

  const openDictionary = (selection: string) => {
    setDictionarySaved(false);
    dictionaryLookupMutation.mutate(
      { exerciseId: currentExercise.id, selection, targetLocale: locale },
      {
        onSuccess: (result) => setDictionary(result),
        onError: () => onMessage(copy.dictionaryUnavailable),
      },
    );
  };

  const saveDictionary = () => {
    if (!dictionary) return;
    saveDictionaryMutation.mutate(
      {
        exerciseId: dictionary.contextExerciseId,
        selection: dictionary.sourceText,
        targetLocale: dictionary.targetLocale,
      },
      {
        onSuccess: () => setDictionarySaved(true),
        onError: () => onMessage(copy.learningError),
      },
    );
  };

  const playSpeech = async (target: "source" | "translation") => {
    if (!dictionary) return;
    const speech = dictionary.speech[target];
    try {
      await speak(speech.text, speech.language, speechRate);
    } catch {
      onMessage(copy.voiceUnavailable);
    }
  };

  const playExercise = async () => {
    try {
      await speak(currentExercise.prompt, lesson.course.language, 0.9);
    } catch {
      onMessage(copy.voiceUnavailable);
    }
  };

  const exerciseInstruction =
    currentExercise.type === "multiple_choice"
      ? copy.exerciseMultipleChoice
      : currentExercise.type === "ordering"
        ? copy.exerciseOrdering
        : currentExercise.type === "matching"
          ? copy.exerciseMatching
          : currentExercise.type === "gap_fill" ||
              currentExercise.type === "typed_answer"
            ? copy.exerciseTyped
            : currentExercise.type === "listening"
              ? copy.exerciseListening
              : copy.exerciseSingleChoice;

  const toggleOption = (optionId: string) => {
    if (
      currentExercise.type === "multiple_choice" ||
      currentExercise.type === "ordering"
    ) {
      setSelected((items) =>
        items.includes(optionId)
          ? items.filter((item) => item !== optionId)
          : [...items, optionId],
      );
    } else setSelected([optionId]);
  };

  const busy =
    submitAnswerMutation.isPending ||
    dictionaryLookupMutation.isPending ||
    saveDictionaryMutation.isPending;
  const matchingComplete = Boolean(
    currentExercise.matching &&
    Object.keys(matchingPairs).length === currentExercise.matching.left.length,
  );

  return (
    <>
      <View style={styles.progressHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.dismiss}
          onPress={onClose}
          style={styles.close}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 1,
            max: lesson.exercises.length,
            now: exerciseIndex + 1,
          }}
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressValue,
              {
                width: `${((exerciseIndex + 1) / lesson.exercises.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.detail}>
          {exerciseIndex + 1}/{lesson.exercises.length}
        </Text>
      </View>
      <Text style={styles.eyebrow}>{exerciseInstruction}</Text>
      <View style={styles.promptCard}>
        <Text style={styles.prompt}>
          {currentExercise.promptTranslation ?? exerciseInstruction}
        </Text>
        <View style={styles.words}>
          {dictionaryTokens(currentExercise.prompt, lesson.course.language).map(
            (word, index) => {
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={word}
                  disabled={dictionaryLookupMutation.isPending}
                  key={`${word}:${index}`}
                  onPress={() => openDictionary(word)}
                >
                  <Text style={styles.word}>{word}</Text>
                </Pressable>
              );
            },
          )}
        </View>
      </View>
      {currentExercise.type === "listening" ? (
        <SmallButton
          label={`🔊 ${copy.listen}`}
          onPress={() => void playExercise()}
        />
      ) : null}
      {currentExercise.type === "matching" && currentExercise.matching ? (
        <View style={styles.options}>
          <Text style={styles.eyebrow}>{copy.matchingChooseLeft}</Text>
          {currentExercise.matching.left.map((option) => {
            const pairedId = matchingPairs[option.id];
            const pairedText = currentExercise.matching?.right.find(
              (candidate) => candidate.id === pairedId,
            )?.text;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={`${option.text}${
                  pairedText ? `, ${copy.matchingPairedWith} ${pairedText}` : ""
                }`}
                accessibilityState={{
                  selected: matchingLeft === option.id,
                  disabled: Boolean(feedback) || submitAnswerMutation.isPending,
                }}
                disabled={Boolean(feedback) || submitAnswerMutation.isPending}
                onPress={() => setMatchingLeft(option.id)}
                style={[
                  styles.option,
                  matchingLeft === option.id && styles.optionSelected,
                ]}
              >
                <Text style={styles.optionTitle}>
                  {option.text}
                  {pairedText ? ` → ${pairedText}` : ""}
                </Text>
              </Pressable>
            );
          })}
          <Text style={styles.eyebrow}>{copy.matchingChooseRight}</Text>
          {currentExercise.matching.right.map((option) => {
            const used = Object.values(matchingPairs).includes(option.id);
            const disabled =
              !matchingLeft ||
              Boolean(feedback) ||
              submitAnswerMutation.isPending;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.text}
                accessibilityState={{ selected: used, disabled }}
                disabled={disabled}
                onPress={() => {
                  if (!matchingLeft) return;
                  setMatchingPairs((current) => ({
                    ...Object.fromEntries(
                      Object.entries(current).filter(
                        ([left, right]) =>
                          left !== matchingLeft && right !== option.id,
                      ),
                    ),
                    [matchingLeft]: option.id,
                  }));
                  setMatchingLeft(null);
                }}
                style={[styles.option, used && styles.optionSelected]}
              >
                <Text style={styles.optionTitle}>{option.text}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : currentExercise.type === "gap_fill" ||
        currentExercise.type === "typed_answer" ? (
        <TextInput
          accessibilityLabel={copy.answerLabel}
          style={styles.input}
          value={typedAnswer}
          onChangeText={setTypedAnswer}
          placeholder={copy.answerPlaceholder}
          placeholderTextColor={colors.textPlaceholder}
          editable={!feedback}
        />
      ) : (
        <View style={styles.options}>
          {currentExercise.type === "ordering" && selected.length > 0 ? (
            <View style={styles.answerPreview}>
              <Text style={styles.answerPreviewLabel}>{copy.yourSentence}</Text>
              <Text style={styles.answerPreviewText}>
                {selected
                  .map(
                    (id) =>
                      currentExercise.options?.find(
                        (option) => option.id === id,
                      )?.text,
                  )
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            </View>
          ) : null}
          {(currentExercise.options ?? []).map((option) => (
            <Pressable
              key={option.id}
              accessibilityRole={
                currentExercise.type === "multiple_choice"
                  ? "checkbox"
                  : "button"
              }
              accessibilityLabel={option.text}
              accessibilityState={{
                selected: selected.includes(option.id),
                checked:
                  currentExercise.type === "multiple_choice"
                    ? selected.includes(option.id)
                    : undefined,
                disabled: Boolean(feedback) || submitAnswerMutation.isPending,
              }}
              onPress={() => toggleOption(option.id)}
              disabled={Boolean(feedback) || submitAnswerMutation.isPending}
              style={[
                styles.option,
                selected.includes(option.id) && styles.optionSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionTitle,
                  selected.includes(option.id) && styles.optionSelectedText,
                ]}
              >
                {currentExercise.type === "multiple_choice"
                  ? `${selected.includes(option.id) ? "☑" : "☐"} ${option.text}`
                  : currentExercise.type === "ordering" &&
                      selected.includes(option.id)
                    ? `${selected.indexOf(option.id) + 1}. ${option.text}`
                    : option.text}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {feedback ? (
        <View style={feedback.correct ? styles.correct : styles.incorrect}>
          <Text style={styles.feedbackTitle}>
            {feedback.correct ? `✓ ${copy.great}` : copy.remember}
          </Text>
          {feedback.feedback.explanation ? (
            <Text style={styles.feedbackBody}>
              {feedback.feedback.explanation}
            </Text>
          ) : null}
        </View>
      ) : null}
      {dictionary ? (
        <View style={styles.dictionaryCard}>
          <View style={styles.courseHeader}>
            <Text style={styles.optionTitle}>{copy.dictionary}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.dismiss}
              onPress={() => setDictionary(null)}
              style={styles.close}
            >
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.dictionaryTerm}>{dictionary.sourceText}</Text>
          {dictionary.dynamic ? (
            <Text style={styles.dynamicBadge}>✦ {copy.dynamicTranslation}</Text>
          ) : null}
          {dictionary.transliteration ? (
            <Text style={styles.detail}>{dictionary.transliteration}</Text>
          ) : null}
          <Text style={styles.dictionaryMeaning}>{dictionary.translation}</Text>
          <Text style={styles.detail}>{dictionary.context}</Text>
          <View style={styles.speechRow}>
            <SmallButton
              label={`🔊 ${copy.listen}`}
              onPress={() => void playSpeech("source")}
            />
            <SmallButton
              label={`🔊 ${copy.listen} (${dictionary.targetLocale.toUpperCase()})`}
              onPress={() => void playSpeech("translation")}
            />
            <SmallButton
              label={speechRate < 1 ? `0.7× ${copy.slower}` : "1×"}
              onPress={() => setSpeechRate((rate) => (rate < 1 ? 1 : 0.7))}
              active={speechRate < 1}
            />
          </View>
          <PrimaryButton
            label={dictionarySaved ? copy.savedReview : copy.saveReview}
            onPress={saveDictionary}
            disabled={dictionarySaved || saveDictionaryMutation.isPending}
          />
        </View>
      ) : null}
      <PrimaryButton
        label={feedback ? copy.next : copy.checkAnswer}
        onPress={() => (feedback ? onAdvance() : submitAnswer())}
        disabled={
          submitAnswerMutation.isPending ||
          completing ||
          (!feedback &&
            !matchingComplete &&
            selected.length === 0 &&
            typedAnswer.trim().length === 0)
        }
      />
      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </>
  );
}
