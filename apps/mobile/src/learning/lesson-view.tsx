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
): unknown => {
  if (exercise.type === "multiple_choice" || exercise.type === "ordering")
    return selected;
  if (exercise.type === "matching") {
    return {
      pairs: Object.fromEntries(
        (exercise.options ?? [])
          .filter((option) => selected.includes(option.id))
          .map((option) => [option.id, option.text]),
      ),
    };
  }
  if (exercise.type === "gap_fill" || exercise.type === "typed_answer")
    return typedAnswer;
  return selected[0] ?? "";
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
}: {
  token: string;
  locale: InterfaceLocale;
  copy: TranslationMap;
  lesson: LearningSessionResponse;
  exerciseIndex: number;
  onClose: () => void;
  onAdvance: () => void;
  onMessage: (text: string | null) => void;
}) {
  const currentExercise = lesson.exercises[exerciseIndex];
  const submitAnswerMutation = useSubmitAnswer(token);
  const dictionaryLookupMutation = useDictionaryLookup(token);
  const saveDictionaryMutation = useSaveDictionary(token);

  const [selected, setSelected] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
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
    setFeedback(null);
    setDictionary(null);
    setDictionarySaved(false);
  }, [exerciseIndex, lesson.sessionId]);

  if (!currentExercise) return null;

  const submitAnswer = () => {
    const answer = answerValue(currentExercise, selected, typedAnswer);
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
        onError: () => onMessage(copy.authError),
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

  const toggleOption = (optionId: string) => {
    if (
      currentExercise.type === "multiple_choice" ||
      currentExercise.type === "ordering" ||
      currentExercise.type === "matching"
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

  return (
    <>
      <View style={styles.progressHeader}>
        <Pressable onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
        <View style={styles.progressTrack}>
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
      <Text style={styles.eyebrow}>{copy.chooseTranslation}</Text>
      <View style={styles.promptCard}>
        <Text
          style={styles.prompt}
          onPress={() => openDictionary(currentExercise.prompt)}
        >
          {currentExercise.prompt}
        </Text>
        <View style={styles.words}>
          {currentExercise.prompt.split(/\s+/).map((word, index) => {
            const clean = word.replace(/[.,!?;:'"“”‘’]/g, "");
            return (
              <Pressable
                key={`${clean}:${index}`}
                onPress={() => openDictionary(clean)}
              >
                <Text style={styles.word}>{clean}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {currentExercise.type === "gap_fill" ||
      currentExercise.type === "typed_answer" ? (
        <TextInput
          style={styles.input}
          value={typedAnswer}
          onChangeText={setTypedAnswer}
          placeholder="…"
          editable={!feedback}
        />
      ) : (
        <View style={styles.options}>
          {(currentExercise.options ?? []).map((option) => (
            <Pressable
              key={option.id}
              onPress={() => toggleOption(option.id)}
              disabled={Boolean(feedback)}
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
                {option.text}
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
            <Pressable onPress={() => setDictionary(null)}>
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
            disabled={dictionarySaved}
          />
        </View>
      ) : null}
      <PrimaryButton
        label={feedback ? copy.next : copy.checkAnswer}
        onPress={() => (feedback ? onAdvance() : submitAnswer())}
        disabled={
          submitAnswerMutation.isPending ||
          (!feedback &&
            selected.length === 0 &&
            typedAnswer.trim().length === 0)
        }
      />
      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </>
  );
}
