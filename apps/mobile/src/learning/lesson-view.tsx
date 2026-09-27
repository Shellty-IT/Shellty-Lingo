import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View, type TextInput } from "react-native";
import type {
  ContextDictionaryResult,
  InterfaceLocale,
  LearnerExercise,
  LearningSessionResponse,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { ApiRequestError, idempotencyKey } from "../api";
import { speak, stopSpeech } from "../speech";
import { type SpeechRate } from "../ui/speech-rate-control";
import {
  useDictionaryLookup,
  useExerciseTutorHint,
  useSaveDictionary,
} from "../queries/learning";
import { sendTelemetry } from "../queries/release";
import { DictionarySheet } from "./dictionary-sheet";
import {
  answerIsReady,
  exerciseInstructionText,
  expectedAnswerText,
  feedbackTone,
  tutorHintForExercise,
} from "./lesson-presentation";
import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";
import { useReliableAttempt } from "./use-reliable-attempt";
import { ExerciseAnswers } from "./exercise-answers";
import { ExerciseFrame } from "./exercise-frame";
import { LessonAudioControls } from "./lesson-audio-controls";
import { CorrectionPractice } from "./correction-practice";

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
  onAnswerFocus: (input?: TextInput | null) => void;
}) {
  const currentExercise = lesson.exercises[exerciseIndex];
  const reliable = useReliableAttempt(
    token,
    `lesson:${lesson.sessionId}:${currentExercise?.id ?? ""}`,
    (attempt) =>
      attempt.kind === "lesson" &&
      attempt.sessionId === lesson.sessionId &&
      attempt.exerciseId === currentExercise?.id,
  );
  const submitting =
    reliable.phase === "submitting" || reliable.phase === "restoring";
  const mounted = useRef(true);
  const dictionaryRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void stopSpeech().catch(() => undefined);
    };
  }, []);
  const exerciseTutorHintMutation = useExerciseTutorHint(token);
  const dictionaryLookupMutation = useDictionaryLookup(token);
  const saveDictionaryMutation = useSaveDictionary(token);

  const [selected, setSelected] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [reading, setReading] = useState(false);
  const [correctionBusy, setCorrectionBusy] = useState(false);
  const sentAt = useRef<number | null>(null);
  useEffect(() => {
    if (!currentExercise) return;
    sendTelemetry(token, "exercise_presented", {
      language: lesson.course.language,
      locale,
      level: lesson.course.level,
      exerciseType: currentExercise.type,
      exerciseId: currentExercise.id,
      sessionId: lesson.sessionId,
    });
  }, [currentExercise?.id]);
  const [matchingPairs, setMatchingPairs] = useState<Record<string, string>>(
    {},
  );
  const [matchingLeft, setMatchingLeft] = useState<string | null>(null);
  const feedback =
    reliable.result && "exerciseId" in reliable.result ? reliable.result : null;
  useEffect(() => {
    if (!feedback || sentAt.current === null || !currentExercise) return;
    sendTelemetry(token, "exercise_result_received", {
      language: lesson.course.language,
      exerciseType: currentExercise.type,
      exerciseId: currentExercise.id,
      sessionId: lesson.sessionId,
      durationMs: Date.now() - sentAt.current,
      status: feedback.feedback.assessment?.status ?? "graded",
    });
    sentAt.current = null;
  }, [feedback?.attemptId]);
  const [dictionary, setDictionary] = useState<ContextDictionaryResult | null>(
    null,
  );
  const [dictionarySaved, setDictionarySaved] = useState(false);
  const [dictionarySelection, setDictionarySelection] = useState<string | null>(
    null,
  );
  const [transcriptTranslation, setTranscriptTranslation] = useState<
    string | null
  >(null);
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1);
  const [tutorHint, setTutorHint] = useState<string | null>(null);

  // Reset per-exercise state whenever the active exercise (or the lesson
  // session itself) changes, matching the previous resetAnswer() call sites.
  useEffect(() => {
    const persistedHint = currentExercise
      ? tutorHintForExercise(lesson.hints, currentExercise.id)
      : undefined;
    setSelected([]);
    setTypedAnswer("");
    setMatchingPairs({});
    setMatchingLeft(null);
    setDictionary(null);
    setDictionarySelection(null);
    setDictionarySaved(false);
    setTranscriptTranslation(null);
    setTutorHint(persistedHint?.hint ?? null);
  }, [currentExercise?.id, exerciseIndex, lesson.hints, lesson.sessionId]);

  useEffect(() => {
    if (reliable.attempt?.kind !== "lesson") return;
    const answer = reliable.attempt.answer;
    if (typeof answer === "string") {
      if (
        currentExercise?.type === "gap_fill" ||
        currentExercise?.type === "typed_answer"
      )
        setTypedAnswer(answer);
      else setSelected([answer]);
    } else if (Array.isArray(answer))
      setSelected(
        answer.filter((item): item is string => typeof item === "string"),
      );
    else if (answer && typeof answer === "object") {
      if ("pairs" in answer)
        setMatchingPairs(answer.pairs as Record<string, string>);
      if ("selected" in answer && typeof answer.selected === "string")
        setSelected([answer.selected]);
      if ("mode" in answer) setReading(answer.mode === "reading");
    }
  }, [reliable.attempt, currentExercise?.type]);

  useEffect(() => {
    if (reliable.phase === "pending_sync") onMessage(copy.offlineProgress);
    if (reliable.phase === "retryable_error") onMessage(copy.attemptNotSaved);
    if (reliable.phase === "rejected") onMessage(copy.answerRejected);
    if (reliable.phase === "graded") onMessage(null);
  }, [
    reliable.phase,
    copy.offlineProgress,
    copy.attemptNotSaved,
    copy.answerRejected,
    onMessage,
  ]);

  useEffect(() => {
    if (!feedback || currentExercise?.type !== "listening") return;
    dictionaryLookupMutation.mutate(
      {
        exerciseId: currentExercise.id,
        selection: currentExercise.prompt,
        targetLocale: locale,
      },
      {
        onSuccess: (translation) => {
          if (mounted.current)
            setTranscriptTranslation(translation.translation);
        },
      },
    );
  }, [feedback?.attemptId]);

  if (!currentExercise) return null;

  const submitAnswer = () => {
    if (reliable.locked) return;
    sentAt.current = Date.now();
    const answer = answerValue(
      currentExercise,
      selected,
      typedAnswer,
      matchingPairs,
    );
    const key = idempotencyKey("answer", lesson.sessionId, currentExercise.id);
    onMessage(null);
    void reliable.submit({
      kind: "lesson",
      sessionId: lesson.sessionId,
      exerciseId: currentExercise.id,
      answer:
        currentExercise.type === "listening"
          ? { selected: answer, mode: reading ? "reading" : "listening" }
          : answer,
      idempotencyKey: key,
    });
  };

  const openDictionary = (selection: string) => {
    const request = ++dictionaryRequest.current;
    setDictionarySaved(false);
    setDictionary(null);
    setDictionarySelection(selection);
    dictionaryLookupMutation.mutate(
      { exerciseId: currentExercise.id, selection, targetLocale: locale },
      {
        onSuccess: (result) => {
          if (!mounted.current || request !== dictionaryRequest.current) return;
          setDictionary(result);
          sendTelemetry(token, "dictionary_opened", {
            language: lesson.course.language,
            source: "lesson",
            dynamic: result.dynamic === true,
          });
        },
        onError: () => {
          if (!mounted.current || request !== dictionaryRequest.current) return;
          setDictionarySelection(null);
          onMessage(copy.dictionaryUnavailable);
        },
      },
    );
  };

  const requestTutorHint = () => {
    if (reliable.locked) return;
    onMessage(null);
    exerciseTutorHintMutation.mutate(
      {
        sessionId: lesson.sessionId,
        exerciseId: currentExercise.id,
        ...(typedAnswer.trim() ? { learnerDraft: typedAnswer.trim() } : {}),
      },
      {
        onSuccess: (result) => {
          if (!mounted.current || result.exerciseId !== currentExercise.id)
            return;
          setTutorHint(result.hint);
        },
        onError: (error) => {
          if (!mounted.current) return;
          onMessage(
            error instanceof ApiRequestError &&
              error.code === "PLAN_LIMIT_REACHED"
              ? copy.tutorHintDailyLimit
              : error instanceof ApiRequestError &&
                  error.code === "EXERCISE_TUTOR_RATE_LIMITED"
                ? copy.tutorHintProviderLimit
                : error instanceof ApiRequestError &&
                    error.code === "EXERCISE_TUTOR_IN_PROGRESS"
                  ? copy.tutorHintLoading
                  : copy.tutorHintUnavailable,
          );
        },
      },
    );
  };

  const saveDictionary = () => {
    if (!dictionary) return;
    const request = dictionaryRequest.current;
    saveDictionaryMutation.mutate(
      {
        exerciseId: dictionary.contextExerciseId,
        selection: dictionary.sourceText,
        targetLocale: dictionary.targetLocale,
      },
      {
        onSuccess: () => {
          if (mounted.current && request === dictionaryRequest.current)
            setDictionarySaved(true);
        },
        onError: () => {
          if (mounted.current && request === dictionaryRequest.current)
            onMessage(copy.learningError);
        },
      },
    );
  };

  const playSpeech = async (target: "source" | "translation") => {
    if (!dictionary) return;
    const request = dictionaryRequest.current;
    const speech = dictionary.speech[target];
    try {
      await speak(speech.text, speech.language, speechRate);
    } catch {
      if (mounted.current && request === dictionaryRequest.current)
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
          : currentExercise.type === "gap_fill"
            ? copy.exerciseGap
            : currentExercise.type === "typed_answer"
              ? copy.exerciseSentence
              : currentExercise.type === "listening"
                ? copy.exerciseListening
                : copy.exerciseSingleChoice;
  const taskInstruction = exerciseInstructionText(
    currentExercise,
    locale,
    exerciseInstruction,
  );

  const answerReady = answerIsReady(
    currentExercise,
    selected,
    typedAnswer,
    matchingPairs,
  );
  const tone = feedback ? feedbackTone(feedback) : null;
  const expected = feedback
    ? expectedAnswerText(
        currentExercise,
        feedback.feedback.expected,
        feedback.feedback.expectedText,
      )
    : null;
  const promptTokens = dictionaryTokens(
    currentExercise.prompt,
    lesson.course.language,
  );
  const promptDictionarySelection = quotedDictionarySelection(
    currentExercise.prompt,
  );
  const closeBlocked = submitting || completing;
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
    dictionaryRequest.current++;
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
          {lesson.lesson.summary ? (
            <Text style={styles.lessonSummary}>{lesson.lesson.summary}</Text>
          ) : null}
        </View>
      </View>
      <ExerciseFrame
        exercise={currentExercise}
        locale={locale}
        copy={copy}
        instruction={taskInstruction}
      >
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
              <LessonAudioControls
                token={token}
                sessionId={lesson.sessionId}
                exercise={currentExercise}
                language={lesson.course.language}
                copy={copy}
                disabled={reliable.locked}
                reading={reading}
                onReading={() => setReading(true)}
              />
              {reading ? (
                <>
                  <Text style={styles.detail}>{copy.readingModeNotice}</Text>
                  <Text
                    style={[
                      styles.prompt,
                      lesson.course.language === "th" &&
                        styles.thaiPromptDisplay,
                    ]}
                  >
                    {currentExercise.prompt}
                  </Text>
                </>
              ) : null}
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
                              openDictionary(
                                promptDictionarySelection.selection,
                              )
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
        <ExerciseAnswers
          exercise={currentExercise}
          copy={copy}
          locked={reliable.locked}
          expected={feedback?.feedback.expected}
          selected={selected}
          onSelected={setSelected}
          typedAnswer={typedAnswer}
          onTypedAnswer={setTypedAnswer}
          pairs={matchingPairs}
          onPairs={setMatchingPairs}
          activeLeft={matchingLeft}
          onActiveLeft={setMatchingLeft}
          onAnswerFocus={onAnswerFocus}
          onSubmit={submitAnswer}
        />
        {currentExercise.type === "gap_fill" ||
        currentExercise.type === "typed_answer" ? (
          <View style={styles.options}>
            {!feedback && !tutorHint ? (
              <SmallButton
                label={
                  exerciseTutorHintMutation.isPending
                    ? copy.tutorHintLoading
                    : copy.tutorHintAction
                }
                onPress={requestTutorHint}
                disabled={
                  exerciseTutorHintMutation.isPending || reliable.locked
                }
              />
            ) : null}
            {tutorHint ? (
              <View
                accessibilityLiveRegion="polite"
                style={styles.tutorHintCard}
              >
                <Text style={styles.tutorHintLabel}>{copy.tutorHintLabel}</Text>
                <Text style={styles.feedbackBody}>{tutorHint}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {feedback ? (
          <View
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
              <Text
                accessibilityLiveRegion="polite"
                style={styles.feedbackTitle}
              >
                {feedback.feedback.assessment?.status === "needs_review"
                  ? copy.assessmentUnresolved
                  : tone === "correct"
                    ? copy.correctAnswer
                    : tone === "partial"
                      ? copy.almostThere
                      : copy.remember}
              </Text>
            </View>
            {feedback.feedback.assessment?.status === "needs_review" ? (
              <Text style={styles.detail}>
                {copy.assessmentUnresolvedNotice}
              </Text>
            ) : null}
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
            {feedback.feedback.usageTip ? (
              <View style={styles.reviewTeachingSection}>
                <Text style={styles.dictionarySectionLabel}>
                  {copy.reviewUsageTip}
                </Text>
                <Text style={styles.feedbackBody}>
                  {feedback.feedback.usageTip}
                </Text>
              </View>
            ) : null}
            {feedback.feedback.practiceMode === "reading" ? (
              <Text style={styles.detail}>{copy.readingModeNotice}</Text>
            ) : null}
            {feedback.feedback.assisted &&
            feedback.feedback.practiceMode !== "reading" ? (
              <Text style={styles.detail}>{copy.tutorAssistedResult}</Text>
            ) : null}
          </View>
        ) : null}
        {feedback &&
        !feedback.correct &&
        (currentExercise.type === "typed_answer" ||
          currentExercise.type === "gap_fill") ? (
          <CorrectionPractice
            key={feedback.attemptId}
            token={token}
            attemptId={feedback.attemptId}
            copy={copy}
            onBusy={setCorrectionBusy}
            onAnswerFocus={onAnswerFocus}
          />
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
            {(transcriptTranslation ?? currentExercise.promptTranslation) ? (
              <Text style={styles.promptTranslation}>
                {transcriptTranslation ?? currentExercise.promptTranslation}
              </Text>
            ) : null}
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
              : reliable.phase === "pending_sync" ||
                  reliable.phase === "retryable_error"
                ? copy.retry
                : copy.checkAnswer
          }
          onPress={() => {
            if (feedback) onAdvance();
            else if (reliable.locked) reliable.retry();
            else submitAnswer();
          }}
          disabled={
            correctionBusy ||
            submitting ||
            completing ||
            reliable.phase === "rejected" ||
            (!feedback && !answerReady)
          }
          loading={submitting || completing}
        />
      </ExerciseFrame>
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
        onRateChange={setSpeechRate}
        onSave={saveDictionary}
      />
    </>
  );
}
