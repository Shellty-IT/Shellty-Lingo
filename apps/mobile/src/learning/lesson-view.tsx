import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
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
import { sendTelemetry } from "../queries/release";
import { DictionarySheet } from "./dictionary-sheet";
import {
  answerIsReady,
  expectedAnswerText,
  feedbackTone,
} from "./lesson-presentation";
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

const quotedDictionarySelection = (
  prompt: string,
): { before: string; selection: string; after: string } | null => {
  const match = /["\u201c\u201e]([^"\u201d]+)["\u201d]/u.exec(prompt);
  if (!match || match.index === undefined || !match[1]?.trim()) return null;
  const selection = match[1].trim();
  const selectionOffset = match[0].indexOf(match[1]);
  const selectionStart =
    match.index + selectionOffset + match[1].indexOf(selection);
  return {
    before: prompt.slice(0, selectionStart),
    selection,
    after: prompt.slice(selectionStart + selection.length),
  };
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
  onAnswerFocus,
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
  onAnswerFocus: () => void;
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
  const [dictionarySelection, setDictionarySelection] = useState<string | null>(
    null,
  );
  const [speechRate, setSpeechRate] = useState(1);
  const [exerciseSpeechRate, setExerciseSpeechRate] = useState(1);

  // Reset per-exercise state whenever the active exercise (or the lesson
  // session itself) changes, matching the previous resetAnswer() call sites.
  useEffect(() => {
    setSelected([]);
    setTypedAnswer("");
    setMatchingPairs({});
    setMatchingLeft(null);
    setFeedback(null);
    setDictionary(null);
    setDictionarySelection(null);
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
    setDictionary(null);
    setDictionarySelection(selection);
    dictionaryLookupMutation.mutate(
      { exerciseId: currentExercise.id, selection, targetLocale: locale },
      {
        onSuccess: (result) => {
          setDictionary(result);
          sendTelemetry(token, "dictionary_opened", {
            language: lesson.course.language,
            source: "lesson",
            dynamic: result.dynamic === true,
          });
        },
        onError: () => {
          setDictionarySelection(null);
          onMessage(copy.dictionaryUnavailable);
        },
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
      await speak(
        currentExercise.prompt,
        lesson.course.language,
        exerciseSpeechRate,
      );
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
  const taskInstruction =
    currentExercise.instructions?.trim() || exerciseInstruction;

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

  const answerReady = answerIsReady(
    currentExercise,
    selected,
    typedAnswer,
    matchingPairs,
  );
  const tone = feedback ? feedbackTone(feedback) : null;
  const expected = feedback
    ? expectedAnswerText(currentExercise, feedback.feedback.expected)
    : null;
  const expectedOptionIds = new Set(
    Array.isArray(feedback?.feedback.expected)
      ? feedback.feedback.expected.filter(
          (value): value is string => typeof value === "string",
        )
      : typeof feedback?.feedback.expected === "string"
        ? [feedback.feedback.expected]
        : [],
  );
  const promptTokens = dictionaryTokens(
    currentExercise.prompt,
    lesson.course.language,
  );
  const promptDictionarySelection = quotedDictionarySelection(
    currentExercise.prompt,
  );
  const closeBlocked = submitAnswerMutation.isPending || completing;
  const requestClose = () => {
    const hasDraft =
      !feedback &&
      (selected.length > 0 ||
        typedAnswer.trim().length > 0 ||
        Object.keys(matchingPairs).length > 0 ||
        matchingLeft !== null);
    if (!hasDraft) {
      onClose();
      return;
    }
    Alert.alert(copy.exitLessonTitle, copy.exitLessonBody, [
      { text: copy.keepLearning, style: "cancel" },
      { text: copy.exitLesson, style: "destructive", onPress: onClose },
    ]);
  };
  const closeDictionary = () => {
    setDictionary(null);
    setDictionarySelection(null);
  };

  return (
    <>
      <View style={styles.progressHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.exitLesson}
          accessibilityState={{ disabled: closeBlocked }}
          disabled={closeBlocked}
          onPress={requestClose}
          style={[styles.close, closeBlocked && styles.disabled]}
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
      <View style={styles.lessonContext}>
        <View style={styles.flex}>
          <Text style={styles.lessonTitle}>{lesson.lesson.title}</Text>
          <Text style={styles.lessonMeta}>
            {copy.exerciseLabel} {exerciseIndex + 1}/{lesson.exercises.length} ·{" "}
            {lesson.course.level}
          </Text>
        </View>
      </View>
      <Text style={styles.exerciseInstruction}>{taskInstruction}</Text>
      <View style={styles.promptCard}>
        {currentExercise.type === "listening" ? (
          <>
            <View style={styles.listeningPromptIcon} accessible={false}>
              <Text style={styles.listeningPromptIconText}>▶</Text>
            </View>
            <Text style={styles.prompt}>{copy.listeningTaskTitle}</Text>
            <Text style={styles.promptTranslation}>
              {copy.listeningTaskBody}
            </Text>
            <View style={styles.listeningActions}>
              <SmallButton
                label={`🔊 ${copy.listen}`}
                onPress={() => void playExercise()}
                disabled={submitAnswerMutation.isPending}
              />
              <SmallButton
                label={exerciseSpeechRate < 1 ? `0.7× ${copy.slower}` : "1×"}
                onPress={() =>
                  setExerciseSpeechRate((rate) => (rate < 1 ? 1 : 0.7))
                }
                active={exerciseSpeechRate < 1}
              />
            </View>
          </>
        ) : (
          <>
            <Text
              style={[
                styles.prompt,
                lesson.course.language === "th" && styles.thaiPromptDisplay,
              ]}
            >
              {promptDictionarySelection ? (
                <>
                  {promptDictionarySelection.before}
                  <Text
                    accessibilityRole="link"
                    accessibilityLabel={promptDictionarySelection.selection}
                    accessibilityHint={copy.tapWordHint}
                    accessibilityState={{
                      disabled: dictionaryLookupMutation.isPending,
                    }}
                    onPress={
                      dictionaryLookupMutation.isPending
                        ? undefined
                        : () =>
                            openDictionary(promptDictionarySelection.selection)
                    }
                    style={styles.promptDictionarySelection}
                  >
                    {promptDictionarySelection.selection}
                  </Text>
                  {promptDictionarySelection.after}
                </>
              ) : (
                currentExercise.prompt
              )}
            </Text>
            {currentExercise.promptTranslation ? (
              <Text style={styles.promptTranslation}>
                {currentExercise.promptTranslation}
              </Text>
            ) : null}
          </>
        )}
      </View>
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
          editable={!feedback && !submitAnswerMutation.isPending}
          returnKeyType="done"
          onFocus={onAnswerFocus}
          onSubmitEditing={() => {
            if (answerReady && !feedback) submitAnswer();
          }}
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
          {(currentExercise.options ?? []).map((option) => {
            const wasSelected = selected.includes(option.id);
            const isExpected = expectedOptionIds.has(option.id);
            const radio =
              currentExercise.type === "single_choice" ||
              currentExercise.type === "listening";
            return (
              <Pressable
                key={option.id}
                accessibilityRole={
                  currentExercise.type === "multiple_choice"
                    ? "checkbox"
                    : radio
                      ? "radio"
                      : "button"
                }
                accessibilityLabel={option.text}
                accessibilityState={{
                  selected: wasSelected,
                  checked:
                    currentExercise.type === "multiple_choice" || radio
                      ? wasSelected
                      : undefined,
                  disabled: Boolean(feedback) || submitAnswerMutation.isPending,
                }}
                onPress={() => toggleOption(option.id)}
                disabled={Boolean(feedback) || submitAnswerMutation.isPending}
                style={[
                  styles.option,
                  wasSelected && styles.optionSelected,
                  feedback && isExpected && styles.optionExpected,
                  feedback && wasSelected && !isExpected
                    ? styles.optionRejected
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.optionTitle,
                    wasSelected && styles.optionSelectedText,
                    feedback && isExpected && styles.optionExpectedText,
                    feedback && wasSelected && !isExpected
                      ? styles.optionRejectedText
                      : null,
                  ]}
                >
                  {currentExercise.type === "multiple_choice"
                    ? `${wasSelected ? "☑" : "☐"} ${option.text}`
                    : currentExercise.type === "ordering" && wasSelected
                      ? `${selected.indexOf(option.id) + 1}. ${option.text}`
                      : option.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
      {feedback ? (
        <View
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[
            styles.feedbackPanel,
            tone === "correct"
              ? styles.feedbackCorrect
              : tone === "partial"
                ? styles.feedbackPartial
                : styles.feedbackIncorrect,
          ]}
        >
          <View style={styles.feedbackHeading}>
            <View
              style={[
                styles.feedbackIcon,
                tone === "correct"
                  ? styles.feedbackIconCorrect
                  : tone === "partial"
                    ? styles.feedbackIconPartial
                    : styles.feedbackIconIncorrect,
              ]}
              accessible={false}
            >
              <Text style={styles.feedbackIconText}>
                {tone === "correct" ? "✓" : tone === "partial" ? "~" : "!"}
              </Text>
            </View>
            <Text style={styles.feedbackTitle}>
              {tone === "correct"
                ? copy.correctAnswer
                : tone === "partial"
                  ? copy.almostThere
                  : copy.remember}
            </Text>
          </View>
          {tone !== "correct" && expected ? (
            <View style={styles.expectedAnswerCard}>
              <Text style={styles.expectedAnswerLabel}>
                {copy.expectedAnswer}
              </Text>
              <Text style={styles.expectedAnswerText}>{expected}</Text>
            </View>
          ) : null}
          {feedback.feedback.explanation ? (
            <Text style={styles.feedbackBody}>
              {feedback.feedback.explanation}
            </Text>
          ) : null}
        </View>
      ) : null}
      {currentExercise.type === "listening" && feedback ? (
        <View style={styles.transcriptCard}>
          <Text style={styles.dictionarySectionLabel}>{copy.transcript}</Text>
          <Text
            style={[
              styles.transcriptText,
              lesson.course.language === "th" && styles.thaiTranscript,
            ]}
          >
            {currentExercise.prompt}
          </Text>
          {promptTokens.length > 0 ? (
            <View style={styles.transcriptWords}>
              {promptTokens.map((word, index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={word}
                  accessibilityHint={copy.tapWordHint}
                  key={`${word}:transcript:${index}`}
                  onPress={() => openDictionary(word)}
                  style={styles.wordTarget}
                >
                  <Text style={styles.transcriptWord}>{word}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      <PrimaryButton
        label={
          feedback
            ? exerciseIndex === lesson.exercises.length - 1
              ? copy.finishLesson
              : copy.next
            : copy.checkAnswer
        }
        onPress={() => (feedback ? onAdvance() : submitAnswer())}
        disabled={
          submitAnswerMutation.isPending ||
          completing ||
          (!feedback && !answerReady)
        }
        loading={submitAnswerMutation.isPending || completing}
      />
      <DictionarySheet
        selection={dictionarySelection}
        dictionary={dictionary}
        saved={dictionarySaved}
        saving={saveDictionaryMutation.isPending}
        speechRate={speechRate}
        copy={copy}
        onClose={closeDictionary}
        onPlaySource={() => void playSpeech("source")}
        onPlayTranslation={() => void playSpeech("translation")}
        onToggleRate={() => setSpeechRate((rate) => (rate < 1 ? 1 : 0.7))}
        onSave={saveDictionary}
      />
    </>
  );
}
