import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  ContextDictionaryResult,
  CourseLanguage,
  ExerciseAttemptResult,
  LearnerExercise,
  LearningDashboard,
  LearningSessionResponse,
  PlacementSessionResponse,
  ReviewQueueItem,
  ReviewRating,
} from "@shellty/api-contracts";
import { getCopy, type Locale } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";

import { apiRequest, idempotencyKey, isRetryableRequestError } from "./api";
import { flushAttempts, queueAttempt } from "./offline-attempts";
import { speak } from "./speech";

type ViewName = "dashboard" | "placement" | "lesson" | "summary" | "reviews";

export function LearningFlow({
  token,
  locale,
  preferredLanguage,
}: {
  token: string;
  locale: Locale;
  preferredLanguage: CourseLanguage;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [view, setView] = useState<ViewName>("dashboard");
  const [language, setLanguage] = useState(preferredLanguage);
  const [dashboard, setDashboard] = useState<LearningDashboard | null>(null);
  const [placement, setPlacement] = useState<PlacementSessionResponse | null>(
    null,
  );
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState<
    Record<string, string>
  >({});
  const [lesson, setLesson] = useState<LearningSessionResponse | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [feedback, setFeedback] = useState<ExerciseAttemptResult | null>(null);
  const [dictionary, setDictionary] = useState<ContextDictionaryResult | null>(
    null,
  );
  const [dictionarySaved, setDictionarySaved] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [summaryScore, setSummaryScore] = useState(0);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const pendingLessonStarts = useRef(new Map<string, string>());

  const loadDashboard = useCallback(
    async (requestedLanguage: CourseLanguage) => {
      setBusy(true);
      setMessage(null);
      try {
        let activeLanguage = requestedLanguage;
        let result: LearningDashboard;
        try {
          result = await apiRequest(
            `/learning/dashboard?language=${requestedLanguage}`,
            { token },
          );
        } catch {
          activeLanguage = requestedLanguage === "en" ? "th" : "en";
          result = await apiRequest(
            `/learning/dashboard?language=${activeLanguage}`,
            { token },
          );
        }
        setLanguage(activeLanguage);
        setDashboard(result);
        const flushed = await flushAttempts(token);
        if (flushed.rejected > 0) setMessage(copy.offlineRejected);
      } catch {
        setMessage(copy.authError);
      } finally {
        setBusy(false);
      }
    },
    [copy.authError, token],
  );

  useEffect(() => {
    void loadDashboard(preferredLanguage);
  }, [loadDashboard, preferredLanguage]);

  const startPlacement = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest<PlacementSessionResponse>(
        "/learning/placement/start",
        {
          method: "POST",
          token,
          body: {
            language,
            interfaceLocale: locale,
            idempotencyKey: idempotencyKey("placement", "onboarding", language),
          },
        },
      );
      setPlacement(result);
      setPlacementIndex(0);
      setPlacementAnswers({});
      setView("placement");
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const finishPlacement = async (skip = false) => {
    if (!placement) return;
    setBusy(true);
    try {
      await apiRequest(`/learning/placement/${placement.sessionId}/submit`, {
        method: "POST",
        token,
        body: {
          answers: skip
            ? []
            : Object.entries(placementAnswers).map(
                ([questionId, selectedOptionId]) => ({
                  questionId,
                  selectedOptionId,
                }),
              ),
        },
      });
      setView("dashboard");
      await loadDashboard(language);
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const startLesson = async (courseSlug: string, lessonSlug: string) => {
    const intent = `${courseSlug}:${lessonSlug}`;
    const requestKey =
      pendingLessonStarts.current.get(intent) ??
      idempotencyKey("lesson", lessonSlug, Date.now().toString());
    pendingLessonStarts.current.set(intent, requestKey);
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest<LearningSessionResponse>(
        `/learning/lessons/${courseSlug}/${lessonSlug}/start`,
        {
          method: "POST",
          token,
          body: {
            idempotencyKey: requestKey,
          },
        },
      );
      pendingLessonStarts.current.delete(intent);
      setLesson(result);
      const firstUnanswered = result.exercises.findIndex(
        (exercise) =>
          !result.attempts.some(
            (attempt) => attempt.exerciseId === exercise.id,
          ),
      );
      setExerciseIndex(firstUnanswered < 0 ? 0 : firstUnanswered);
      resetAnswer();
      setView("lesson");
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const resetAnswer = () => {
    setSelected([]);
    setTypedAnswer("");
    setFeedback(null);
    setDictionary(null);
    setDictionarySaved(false);
  };

  const currentExercise = lesson?.exercises[exerciseIndex];
  const answerValue = (exercise: LearnerExercise): unknown => {
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

  const submitAnswer = async () => {
    if (!lesson || !currentExercise) return;
    const answer = answerValue(currentExercise);
    const key = idempotencyKey("answer", lesson.sessionId, currentExercise.id);
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiRequest<ExerciseAttemptResult>(
        `/learning/sessions/${lesson.sessionId}/attempts`,
        {
          method: "POST",
          token,
          body: {
            exerciseId: currentExercise.id,
            answer,
            idempotencyKey: key,
          },
        },
      );
      setFeedback(result);
    } catch (reason) {
      if (isRetryableRequestError(reason)) {
        await queueAttempt({
          sessionId: lesson.sessionId,
          exerciseId: currentExercise.id,
          answer,
          idempotencyKey: key,
        });
        setMessage(copy.offlineProgress);
      } else setMessage(copy.answerRejected);
    } finally {
      setBusy(false);
    }
  };

  const nextExercise = async () => {
    if (!lesson) return;
    if (exerciseIndex < lesson.exercises.length - 1) {
      setExerciseIndex((value) => value + 1);
      resetAnswer();
      return;
    }
    setBusy(true);
    try {
      const result = await apiRequest<{
        score: number;
        dueReviews: number;
      }>(`/learning/sessions/${lesson.sessionId}/complete`, {
        method: "POST",
        token,
      });
      setSummaryScore(result.score);
      setView("summary");
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const openDictionary = async (selection: string) => {
    if (!currentExercise) return;
    setBusy(true);
    setDictionarySaved(false);
    try {
      const result = await apiRequest<ContextDictionaryResult>(
        "/learning/dictionary",
        {
          method: "POST",
          token,
          body: {
            exerciseId: currentExercise.id,
            selection,
            targetLocale: locale,
          },
        },
      );
      setDictionary(result);
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const saveDictionary = async () => {
    if (!dictionary) return;
    setBusy(true);
    try {
      await apiRequest("/learning/dictionary/save", {
        method: "POST",
        token,
        body: {
          exerciseId: dictionary.contextExerciseId,
          selection: dictionary.sourceText,
          targetLocale: dictionary.targetLocale,
        },
      });
      setDictionarySaved(true);
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const playSpeech = async (target: "source" | "translation") => {
    if (!dictionary) return;
    const speech = dictionary.speech[target];
    try {
      await speak(speech.text, speech.language, speechRate);
    } catch {
      setMessage(copy.voiceUnavailable);
    }
  };

  const openReviews = async () => {
    setBusy(true);
    try {
      const result = await apiRequest<ReviewQueueItem[]>(
        `/learning/reviews?language=${language}`,
        { token },
      );
      setReviews(result);
      setView("reviews");
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const rateReview = async (rating: ReviewRating) => {
    const item = reviews[0];
    if (!item) return;
    setBusy(true);
    try {
      await apiRequest(`/learning/reviews/${item.id}`, {
        method: "POST",
        token,
        body: {
          rating,
          idempotencyKey: idempotencyKey(
            "review",
            item.id,
            item.repetitions.toString(),
          ),
        },
      });
      setReviews((items) => items.slice(1));
    } catch {
      setMessage(copy.authError);
    } finally {
      setBusy(false);
    }
  };

  const toggleOption = (exercise: LearnerExercise, optionId: string) => {
    if (
      exercise.type === "multiple_choice" ||
      exercise.type === "ordering" ||
      exercise.type === "matching"
    ) {
      setSelected((items) =>
        items.includes(optionId)
          ? items.filter((item) => item !== optionId)
          : [...items, optionId],
      );
    } else setSelected([optionId]);
  };

  if (busy && !dashboard && !placement && !lesson)
    return <ActivityIndicator color={colors.actionPrimary} />;

  return (
    <View style={styles.flow}>
      {message ? (
        <View style={styles.message}>
          <Text style={styles.messageText}>{message}</Text>
          <Pressable onPress={() => setMessage(null)}>
            <Text style={styles.messageAction}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {view === "dashboard" && dashboard ? (
        <>
          <View style={styles.courseHeader}>
            <View>
              <Text style={styles.eyebrow}>{copy.lessons}</Text>
              <Text style={styles.title}>
                {language === "en" ? copy.english : copy.thai}
              </Text>
            </View>
            <Text style={styles.level}>
              {copy.levelLabel} {dashboard.level}
            </Text>
          </View>
          {!dashboard.placementCompleted ? (
            <View style={styles.darkCard}>
              <Text style={styles.darkTitle}>{copy.placementBadge}</Text>
              <Text style={styles.darkBody}>{copy.placementMeta}</Text>
              <PrimaryButton
                label={copy.startPlacement}
                onPress={() => void startPlacement()}
              />
            </View>
          ) : null}
          {dashboard.dueReviews > 0 ? (
            <Pressable
              style={styles.reviewBanner}
              onPress={() => void openReviews()}
            >
              <View>
                <Text style={styles.optionTitle}>{copy.reviews}</Text>
                <Text style={styles.detail}>
                  {dashboard.dueReviews} {copy.dueSuffix}
                </Text>
              </View>
              <Text style={styles.reviewCount}>{dashboard.dueReviews}</Text>
            </Pressable>
          ) : null}
          {dashboard.courses.flatMap((course) =>
            course.modules.flatMap((module) => [
              <View
                key={`${course.slug}:${module.slug}`}
                style={styles.moduleCard}
              >
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.darkBody}>
                  {module.lessons.length} {copy.lessonCountSuffix}
                </Text>
              </View>,
              ...module.lessons.map((item) => (
                <Pressable
                  key={`${course.slug}:${item.slug}`}
                  style={[
                    styles.lessonCard,
                    item.status === "in_progress" && styles.lessonCardActive,
                  ]}
                  onPress={() => void startLesson(course.slug, item.slug)}
                >
                  <View style={styles.lessonIcon}>
                    <Text style={styles.lessonIconText}>
                      {item.status === "completed" ? "✓" : "▶"}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.optionTitle}>{item.title}</Text>
                    <Text style={styles.detail}>
                      {item.status === "completed"
                        ? `${copy.completed} · ${Math.round(item.bestScore * 100)}%`
                        : `${copy.continueLesson} · ${item.estimatedMinutes} min`}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              )),
            ]),
          )}
        </>
      ) : null}

      {view === "placement" && placement ? (
        <PlacementView
          placement={placement}
          index={placementIndex}
          selected={placementAnswers}
          copy={copy}
          onSelect={(questionId, optionId) =>
            setPlacementAnswers((answers) => ({
              ...answers,
              [questionId]: optionId,
            }))
          }
          onNext={() => {
            if (placementIndex < placement.questions.length - 1)
              setPlacementIndex((value) => value + 1);
            else void finishPlacement();
          }}
          onSkip={() => void finishPlacement(true)}
        />
      ) : null}

      {view === "lesson" && lesson && currentExercise ? (
        <>
          <View style={styles.progressHeader}>
            <Pressable
              onPress={() => setView("dashboard")}
              style={styles.close}
            >
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
              onPress={() => void openDictionary(currentExercise.prompt)}
            >
              {currentExercise.prompt}
            </Text>
            <View style={styles.words}>
              {currentExercise.prompt.split(/\s+/).map((word, index) => {
                const clean = word.replace(/[.,!?;:'"“”‘’]/g, "");
                return (
                  <Pressable
                    key={`${clean}:${index}`}
                    onPress={() => void openDictionary(clean)}
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
                  onPress={() => toggleOption(currentExercise, option.id)}
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
              {dictionary.transliteration ? (
                <Text style={styles.detail}>{dictionary.transliteration}</Text>
              ) : null}
              <Text style={styles.dictionaryMeaning}>
                {dictionary.translation}
              </Text>
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
                  label={speechRate < 1 ? "1×" : `0.7× ${copy.slower}`}
                  onPress={() => setSpeechRate((rate) => (rate < 1 ? 1 : 0.7))}
                />
              </View>
              <PrimaryButton
                label={dictionarySaved ? copy.savedReview : copy.saveReview}
                onPress={() => void saveDictionary()}
                disabled={dictionarySaved}
              />
            </View>
          ) : null}
          <PrimaryButton
            label={feedback ? copy.next : copy.checkAnswer}
            onPress={() => void (feedback ? nextExercise() : submitAnswer())}
            disabled={
              busy ||
              (!feedback &&
                selected.length === 0 &&
                typedAnswer.trim().length === 0)
            }
          />
        </>
      ) : null}

      {view === "summary" ? (
        <View style={styles.summary}>
          <View style={styles.summaryCircle}>
            <Text style={styles.summaryScore}>
              {Math.round(summaryScore * 100)}%
            </Text>
          </View>
          <Text style={styles.title}>{copy.lessonComplete}</Text>
          <Text style={styles.detail}>{copy.score}</Text>
          <PrimaryButton
            label={copy.continue}
            onPress={() => {
              setView("dashboard");
              void loadDashboard(language);
            }}
          />
        </View>
      ) : null}

      {view === "reviews" ? (
        <View style={styles.flow}>
          <View style={styles.courseHeader}>
            <Text style={styles.title}>{copy.reviews}</Text>
            <Pressable onPress={() => setView("dashboard")}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {reviews[0] ? (
            <>
              <View style={styles.promptCard}>
                <Text style={styles.prompt}>{reviews[0].sourceText}</Text>
              </View>
              <View style={styles.dictionaryCard}>
                <Text style={styles.dictionaryMeaning}>
                  {reviews[0].translation}
                </Text>
                {reviews[0].context ? (
                  <Text style={styles.detail}>{reviews[0].context}</Text>
                ) : null}
              </View>
              <View style={styles.ratingRow}>
                {(["again", "hard", "good", "easy"] as const).map((rating) => (
                  <SmallButton
                    key={rating}
                    label={copy[rating]}
                    onPress={() => void rateReview(rating)}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.summary}>
              <Text style={styles.summaryScore}>✓</Text>
              <Text style={styles.optionTitle}>{copy.noReviews}</Text>
            </View>
          )}
        </View>
      ) : null}

      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}

function PlacementView({
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
  copy: ReturnType<typeof getCopy>;
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

function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.smallButton}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flow: { gap: spacing[3] },
  flex: { flex: 1 },
  title: { ...typography.heading, color: colors.textPrimary },
  eyebrow: {
    ...typography.title,
    color: colors.textSecondary,
    fontSize: 12,
    letterSpacing: 0.7,
  },
  courseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  level: {
    ...typography.title,
    color: colors.actionPrimary,
    backgroundColor: "#EFF5FF",
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 13,
  },
  darkCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundInverse,
    padding: spacing[5],
    gap: spacing[2],
  },
  darkTitle: { ...typography.title, color: colors.textInverse },
  darkBody: { ...typography.body, color: "#9FB5D3", fontSize: 13 },
  moduleCard: {
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundInverse,
    padding: spacing[4],
  },
  moduleTitle: { ...typography.title, color: colors.textInverse },
  lessonCard: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
  },
  lessonCardActive: { borderWidth: 2, borderColor: colors.actionPrimary },
  lessonIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: colors.actionPrimary,
  },
  lessonIconText: { color: colors.textInverse, fontSize: 18 },
  optionTitle: { ...typography.title, color: colors.textPrimary },
  detail: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  chevron: { color: colors.actionPrimary, fontSize: 24 },
  reviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: "#E8F7F4",
  },
  reviewCount: {
    ...typography.title,
    color: colors.textInverse,
    backgroundColor: colors.actionSupport,
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
  },
  closeText: { color: colors.textSecondary, fontSize: 24 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.borderDefault,
  },
  progressValue: { height: "100%", backgroundColor: "#12B5A8" },
  promptCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundInverse,
    padding: spacing[6],
    gap: spacing[4],
  },
  prompt: {
    ...typography.heading,
    color: colors.textInverse,
    textAlign: "center",
  },
  words: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
  },
  word: {
    ...typography.body,
    color: "#9FC4FF",
    textDecorationLine: "underline",
  },
  options: { gap: spacing[3] },
  option: {
    minHeight: 56,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.borderDefault,
    borderRadius: radii.lg,
    padding: spacing[4],
    backgroundColor: colors.backgroundCard,
  },
  optionSelected: { borderColor: "#12B5A8", backgroundColor: "#E8F7F4" },
  optionSelectedText: { color: colors.actionSupport },
  input: {
    minHeight: 54,
    borderWidth: 2,
    borderColor: colors.actionPrimary,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing[4],
    ...typography.body,
    color: colors.textPrimary,
  },
  correct: {
    borderRadius: radii.lg,
    padding: spacing[4],
    backgroundColor: "#E8F7F4",
  },
  incorrect: {
    borderRadius: radii.lg,
    padding: spacing[4],
    backgroundColor: "#FFF0EA",
  },
  feedbackTitle: { ...typography.title, color: colors.textPrimary },
  feedbackBody: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
  },
  dictionaryCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
    padding: spacing[5],
    gap: spacing[3],
  },
  dictionaryTerm: { ...typography.heading, color: colors.actionPrimary },
  dictionaryMeaning: { ...typography.title, color: colors.textPrimary },
  speechRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.actionPrimary,
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
  },
  primaryButtonText: {
    ...typography.title,
    color: colors.textInverse,
    textAlign: "center",
  },
  smallButton: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing[3],
  },
  smallButtonText: {
    ...typography.body,
    color: colors.actionPrimary,
    fontSize: 12,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.8 },
  badge: {
    alignSelf: "flex-start",
    ...typography.title,
    color: colors.actionSupport,
    backgroundColor: "#E8F7F4",
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 12,
  },
  skip: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  summary: {
    alignItems: "center",
    gap: spacing[4],
    paddingVertical: spacing[8],
  },
  summaryCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
    borderColor: "#12B5A8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundCard,
  },
  summaryScore: { ...typography.display, color: colors.actionSupport },
  ratingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing[2],
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radii.md,
    padding: spacing[3],
    backgroundColor: "#FFF0EA",
  },
  messageText: {
    ...typography.body,
    color: colors.error,
    fontSize: 12,
    flex: 1,
  },
  messageAction: { color: colors.error, fontSize: 22 },
});
