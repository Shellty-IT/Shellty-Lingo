import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type TextInput,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type {
  AdvancedExamResult,
  CourseLanguage,
  LearningSessionResponse,
  PlacementSessionResponse,
  ReviewQueueItem,
  ReviewRating,
  ReviewBatchResponse,
} from "@shellty/api-contracts";
import { getCopy, type Locale } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { apiRequest, idempotencyKey } from "./api";
import { flushAttempts, recoverLegacyLesson } from "./offline-attempts";
import { sendTelemetry } from "./queries/release";
import { DashboardView } from "./learning/dashboard-view";
import { AdvancedExamResultView } from "./learning/advanced-exam-result-view";
import { LessonView } from "./learning/lesson-view";
import { PlacementView } from "./learning/placement-view";
import { ReviewsView } from "./learning/reviews-view";
import { styles } from "./learning/styles";
import { SummaryView } from "./learning/summary-view";
import type { LearningIntent } from "./learning-intent";
import { StatePanel } from "./ui/state-panel";
import { useReliableAttempt } from "./learning/use-reliable-attempt";
import {
  useCompleteLesson,
  useLearningDashboard,
  useAssessReview,
  useReviewBatch,
  useStartLesson,
  useStartC1Exam,
  useStartPlacement,
  useSubmitPlacement,
  useSubmitC1Exam,
} from "./queries/learning";

type ViewName =
  | "dashboard"
  | "launching"
  | "placement"
  | "lesson"
  | "summary"
  | "reviews"
  | "c1-result";

export function LearningFlow({
  token,
  locale,
  preferredLanguage,
  initialIntent,
  onIntentHandled,
  onFocusedChange,
  onAnswerFocus,
  onExerciseChange,
}: {
  token: string;
  locale: Locale;
  preferredLanguage: CourseLanguage;
  initialIntent: LearningIntent | null;
  onIntentHandled: () => void;
  onFocusedChange: (focused: boolean) => void;
  onAnswerFocus: (input?: TextInput | null) => void;
  onExerciseChange?: () => void;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewName>("dashboard");
  const dashboardQuery = useLearningDashboard(token, preferredLanguage, locale);
  const language = dashboardQuery.data?.language ?? preferredLanguage;

  const [placement, setPlacement] = useState<PlacementSessionResponse | null>(
    null,
  );
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState<
    Record<string, string>
  >({});
  const [assessmentKind, setAssessmentKind] = useState<"placement" | "c1">(
    "placement",
  );
  const [c1Result, setC1Result] = useState<AdvancedExamResult | null>(null);
  const [lesson, setLesson] = useState<LearningSessionResponse | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [lessonSummary, setLessonSummary] = useState<{
    score: number;
    dueReviews: number;
    unresolvedCount?: number;
    independentlyCorrect?: number;
  }>({
    score: 0,
    dueReviews: 0,
  });
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [batchSize, setBatchSize] = useState<5 | 10>(5);
  const [batchTotal, setBatchTotal] = useState(0);
  const [remainingDue, setRemainingDue] = useState(0);
  const [batchSkipped, setBatchSkipped] = useState(0);
  const batchReported = useRef(false);
  useEffect(() => {
    if (
      view === "reviews" &&
      batchTotal > 0 &&
      reviews.length === 0 &&
      !batchReported.current
    ) {
      batchReported.current = true;
      sendTelemetry(token, "review_batch_completed", {
        language,
        size: batchTotal,
        skipped: batchSkipped,
      });
    }
  }, [view, batchTotal, reviews.length, batchSkipped, language, token]);
  const [message, setMessage] = useState<string | null>(null);
  const pendingLessonStarts = useRef(new Map<string, string>());
  const pendingAssessmentStarts = useRef(new Map<string, string>());
  const handledIntent = useRef<string | null>(null);

  const startPlacementMutation = useStartPlacement(token);
  const submitPlacementMutation = useSubmitPlacement(token);
  const startC1ExamMutation = useStartC1Exam(token);
  const submitC1ExamMutation = useSubmitC1Exam(token);
  const startLessonMutation = useStartLesson(token);
  const completeLessonMutation = useCompleteLesson(token);
  const reviewsQuery = useReviewBatch(token, language, locale, batchSize);
  const currentReview = reviews[0];
  const reviewSave = useReliableAttempt(
    token,
    `review:${currentReview?.id ?? ""}:${currentReview?.scheduleRevision ?? 0}`,
    (attempt) =>
      attempt.kind === "review" &&
      attempt.itemId === currentReview?.id &&
      attempt.expectedScheduleRevision === currentReview?.scheduleRevision,
  );
  const assessReviewMutation = useAssessReview(token);
  useEffect(() => {
    if (view === "lesson" || view === "reviews" || view === "placement")
      onExerciseChange?.();
  }, [
    view,
    lesson?.sessionId,
    exerciseIndex,
    currentReview?.id,
    currentReview?.scheduleRevision,
    placementIndex,
    onExerciseChange,
  ]);

  useEffect(() => {
    let active = true;
    if (
      reviewSave.phase === "graded" &&
      reviewSave.result &&
      "itemId" in reviewSave.result
    ) {
      const completedId = reviewSave.result.itemId;
      setReviews((items) => items.filter((item) => item.id !== completedId));
      void queryClient.invalidateQueries({
        queryKey: ["growth", "today", token, language],
      });
      setMessage(null);
    } else if (reviewSave.phase === "pending_sync")
      setMessage(copy.offlineProgress);
    else if (reviewSave.phase === "retryable_error")
      setMessage(copy.attemptNotSaved);
    else if (reviewSave.phase === "rejected") {
      setMessage(copy.reviewSyncConflict);
      void reviewsQuery.refetch().then((result) => {
        if (active && result.data) setReviews(result.data.items);
      });
    }
    return () => {
      active = false;
    };
  }, [reviewSave.phase, reviewSave.result]);

  useEffect(() => {
    if (dashboardQuery.isError) setMessage(copy.learningError);
  }, [dashboardQuery.isError, copy.learningError]);

  useEffect(() => {
    onFocusedChange(view !== "dashboard");
    return () => onFocusedChange(false);
  }, [onFocusedChange, view]);

  // Flush any offline-queued attempts once the dashboard has loaded for the
  // first time, matching the previous post-load flush in loadDashboard().
  const initialFlushDone = useRef(false);
  useEffect(() => {
    if (!dashboardQuery.isSuccess || initialFlushDone.current) return;
    initialFlushDone.current = true;
    void flushAttempts(token)
      .then((flushed) => {
        if (flushed.rejected > 0) setMessage(copy.offlineRejected);
      })
      .catch(() => setMessage(copy.attemptNotSaved));
  }, [dashboardQuery.isSuccess, token, copy.offlineRejected]);

  const returnToDashboard = async () => {
    setView("dashboard");
    await Promise.all([
      dashboardQuery.refetch(),
      queryClient.invalidateQueries({
        queryKey: ["growth", "today", token, language],
      }),
    ]);
    try {
      const flushed = await flushAttempts(token);
      if (flushed.rejected > 0) setMessage(copy.offlineRejected);
    } catch {
      setMessage(copy.attemptNotSaved);
    }
  };

  const startPlacement = () => {
    if (startPlacementMutation.isPending) return;
    setMessage(null);
    const intent = `placement:${language}:${locale}`;
    const requestKey =
      pendingAssessmentStarts.current.get(intent) ??
      idempotencyKey("placement", "attempt", language, Date.now().toString());
    pendingAssessmentStarts.current.set(intent, requestKey);
    startPlacementMutation.mutate(
      {
        language,
        interfaceLocale: locale,
        idempotencyKey: requestKey,
      },
      {
        onSuccess: (result) => {
          pendingAssessmentStarts.current.delete(intent);
          setAssessmentKind("placement");
          setPlacement(result);
          setPlacementIndex(0);
          setPlacementAnswers({});
          setView("placement");
        },
        onError: () => setMessage(copy.learningError),
      },
    );
  };

  const startC1Exam = () => {
    if (startC1ExamMutation.isPending) return;
    setMessage(null);
    const intent = `c1-exam:${locale}`;
    const requestKey =
      pendingAssessmentStarts.current.get(intent) ??
      idempotencyKey("c1-exam", "attempt", Date.now().toString());
    pendingAssessmentStarts.current.set(intent, requestKey);
    startC1ExamMutation.mutate(
      {
        interfaceLocale: locale,
        idempotencyKey: requestKey,
      },
      {
        onSuccess: (result) => {
          pendingAssessmentStarts.current.delete(intent);
          setAssessmentKind("c1");
          setPlacement(result);
          setPlacementIndex(0);
          setPlacementAnswers({});
          setView("placement");
        },
        onError: () => setMessage(copy.learningError),
      },
    );
  };

  const finishPlacement = (skip = false) => {
    if (
      !placement ||
      submitPlacementMutation.isPending ||
      submitC1ExamMutation.isPending
    )
      return;
    const answers = Object.entries(placementAnswers).map(
      ([questionId, selectedOptionId]) => ({ questionId, selectedOptionId }),
    );
    if (assessmentKind === "c1") {
      submitC1ExamMutation.mutate(
        { sessionId: placement.sessionId, answers },
        {
          onSuccess: (result) => {
            setC1Result(result);
            setView("c1-result");
          },
          onError: () => setMessage(copy.learningError),
        },
      );
      return;
    }
    submitPlacementMutation.mutate(
      {
        sessionId: placement.sessionId,
        answers: skip ? [] : answers,
      },
      {
        onSuccess: () => void returnToDashboard(),
        onError: () => setMessage(copy.learningError),
      },
    );
  };

  const startLesson = (courseSlug: string, lessonSlug: string) => {
    if (startLessonMutation.isPending) return;
    setView("launching");
    const intent = `${courseSlug}:${lessonSlug}`;
    const requestKey =
      pendingLessonStarts.current.get(intent) ??
      idempotencyKey("lesson", lessonSlug, Date.now().toString());
    pendingLessonStarts.current.set(intent, requestKey);
    const startedAt = Date.now();
    setMessage(null);
    startLessonMutation.mutate(
      {
        courseSlug,
        lessonSlug,
        interfaceLocale: locale,
        idempotencyKey: requestKey,
      },
      {
        onSuccess: async (result) => {
          sendTelemetry(token, "lesson_start_timing", {
            language,
            durationMs: Date.now() - startedAt,
          });
          try {
            await recoverLegacyLesson(result.sessionId);
          } catch {
            setMessage(copy.attemptNotSaved);
          }
          pendingLessonStarts.current.delete(intent);
          setLesson(result);
          const firstUnanswered = result.exercises.findIndex(
            (exercise) =>
              !result.attempts.some(
                (attempt) => attempt.exerciseId === exercise.id,
              ),
          );
          if (firstUnanswered < 0) {
            completeLessonMutation.mutate(result.sessionId, {
              onSuccess: (completion) => {
                setLessonSummary(completion);
                setView("summary");
              },
              onError: () => {
                setView("dashboard");
                setMessage(copy.learningError);
              },
            });
            return;
          }
          setExerciseIndex(firstUnanswered);
          setView("lesson");
        },
        onError: () => {
          setView("dashboard");
          setMessage(copy.learningError);
        },
      },
    );
  };

  const advanceLesson = () => {
    if (!lesson || completeLessonMutation.isPending) return;
    if (exerciseIndex < lesson.exercises.length - 1) {
      setExerciseIndex((value) => value + 1);
      return;
    }
    completeLessonMutation.mutate(lesson.sessionId, {
      onSuccess: (result) => {
        setLessonSummary(result);
        setView("summary");
      },
      onError: () => setMessage(copy.learningError),
    });
  };

  const openReviews = async (size: 5 | 10 = batchSize) => {
    setMessage(null);
    setView("launching");
    try {
      const batch = await apiRequest<ReviewBatchResponse>(
        `/learning/reviews/batch?language=${language}&interfaceLocale=${locale}&size=${size}`,
        { token },
      );
      setBatchSize(size);
      setReviews(batch.items);
      setBatchTotal(batch.items.length);
      setRemainingDue(batch.remainingDue);
      setBatchSkipped(0);
      batchReported.current = false;
      sendTelemetry(token, "review_session_opened", {
        language,
        queueSize: batch.totalDue,
      });
      setView("reviews");
    } catch {
      setView("dashboard");
      setMessage(copy.learningError);
    }
  };

  useEffect(() => {
    if (
      !initialIntent ||
      !dashboardQuery.data ||
      handledIntent.current === initialIntent.requestId
    )
      return;
    handledIntent.current = initialIntent.requestId;
    onIntentHandled();
    if (initialIntent.kind === "browse") {
      setView("dashboard");
      return;
    }
    if (initialIntent.kind === "reviews") {
      void openReviews();
      return;
    }
    const course = dashboardQuery.data.dashboard.courses.find((candidate) =>
      candidate.modules.some((module) =>
        module.lessons.some(
          (lessonItem) => lessonItem.slug === initialIntent.lessonSlug,
        ),
      ),
    );
    if (!course) {
      setMessage(copy.learningError);
      return;
    }
    startLesson(course.slug, initialIntent.lessonSlug);
  }, [copy.learningError, dashboardQuery.data, initialIntent, onIntentHandled]);

  const rateReview = (rating: ReviewRating) => {
    const item = reviews[0];
    if (!item || reviewSave.locked) return;
    void reviewSave.submit({
      kind: "review",
      itemId: item.id,
      rating,
      expectedScheduleRevision: item.scheduleRevision,
      idempotencyKey: idempotencyKey(
        "review",
        item.id,
        item.scheduleRevision.toString(),
      ),
    });
  };

  if (dashboardQuery.isLoading && !dashboardQuery.data)
    return <StatePanel kind="loading" title={copy.loading} body={copy.ready} />;
  if (dashboardQuery.isError && !dashboardQuery.data)
    return (
      <StatePanel
        kind="error"
        title={copy.learningError}
        body={copy.planErrorBody}
        actionLabel={copy.retry}
        onAction={() => void dashboardQuery.refetch()}
      />
    );

  const busy =
    startPlacementMutation.isPending ||
    submitPlacementMutation.isPending ||
    startC1ExamMutation.isPending ||
    submitC1ExamMutation.isPending ||
    startLessonMutation.isPending ||
    completeLessonMutation.isPending;

  return (
    <View style={styles.flow}>
      {message ? (
        <View style={styles.message} accessibilityRole="alert">
          <Text style={styles.messageText}>{message}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.dismiss}
            onPress={() => setMessage(null)}
            style={styles.messageDismiss}
          >
            <Text style={styles.messageAction}>×</Text>
          </Pressable>
        </View>
      ) : null}

      {view === "dashboard" && dashboardQuery.data ? (
        <DashboardView
          dashboard={dashboardQuery.data.dashboard}
          language={language}
          copy={copy}
          onStartPlacement={startPlacement}
          onOpenReviews={() => void openReviews()}
          onStartLesson={startLesson}
          onStartC1Exam={startC1Exam}
          disabled={busy}
        />
      ) : null}

      {view === "launching" ? (
        <StatePanel kind="loading" title={copy.loading} body={copy.ready} />
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
            else finishPlacement();
          }}
          onSkip={() => finishPlacement(true)}
          onAudioError={() => setMessage(copy.voiceUnavailable)}
          allowSkip={assessmentKind === "placement"}
          badge={
            assessmentKind === "c1" ? copy.c1ExamTitle : copy.placementBadge
          }
          disabled={busy}
        />
      ) : null}

      {view === "lesson" && lesson ? (
        <LessonView
          key={`${lesson.sessionId}:${lesson.exercises[exerciseIndex]?.id}`}
          token={token}
          locale={lesson.interfaceLocale ?? locale}
          copy={getCopy(lesson.interfaceLocale ?? locale)}
          lesson={lesson}
          exerciseIndex={exerciseIndex}
          onClose={() => {
            sendTelemetry(token, "lesson_exited", {
              language: lesson.course.language,
              progressPercent: Math.round(
                (exerciseIndex / Math.max(1, lesson.exercises.length)) * 100,
              ),
              hadAnswer: exerciseIndex > 0 || lesson.attempts.length > 0,
            });
            setView("dashboard");
          }}
          onAdvance={advanceLesson}
          onMessage={setMessage}
          completing={completeLessonMutation.isPending}
          onAnswerFocus={onAnswerFocus}
        />
      ) : null}

      {view === "summary" ? (
        <SummaryView
          key={lesson?.sessionId}
          onComfort={(rating) =>
            sendTelemetry(token, "learning_comfort", {
              language,
              rating,
              source: "lesson",
            })
          }
          summary={lessonSummary}
          lessonTitle={lesson?.lesson.title ?? copy.lessonComplete}
          exerciseCount={lesson?.exercises.length ?? 0}
          copy={copy}
          onContinue={() => void returnToDashboard()}
        />
      ) : null}

      {view === "c1-result" && c1Result ? (
        <AdvancedExamResultView
          result={c1Result}
          copy={copy}
          onContinue={() => void returnToDashboard()}
        />
      ) : null}

      {view === "reviews" ? (
        <ReviewsView
          key={`${currentReview?.id}:${currentReview?.scheduleRevision}`}
          reviews={reviews}
          batchTotal={batchTotal}
          remainingDue={remainingDue}
          batchSize={batchSize}
          onNextBatch={(size) => void openReviews(size)}
          onSkip={() => {
            setReviews((items) => items.slice(1));
            setBatchSkipped((count) => count + 1);
            setRemainingDue((count) => count + 1);
          }}
          copy={copy}
          locale={locale}
          onClose={() => setView("dashboard")}
          onRate={rateReview}
          pendingRating={
            reviewSave.attempt?.kind === "review"
              ? reviewSave.attempt.rating
              : undefined
          }
          onRetry={reviewSave.retry}
          onAssess={(itemId, answer) =>
            assessReviewMutation.mutateAsync({
              itemId,
              answer,
              language,
              interfaceLocale: locale,
            })
          }
          onAnswerFocus={onAnswerFocus}
          disabled={
            reviewSave.phase === "submitting" ||
            reviewSave.phase === "restoring" ||
            assessReviewMutation.isPending
          }
        />
      ) : null}

      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}
