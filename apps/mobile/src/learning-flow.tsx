import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type {
  AdvancedExamResult,
  CourseLanguage,
  LearningSessionResponse,
  PlacementSessionResponse,
  ReviewQueueItem,
  ReviewRating,
} from "@shellty/api-contracts";
import { getCopy, type Locale } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { idempotencyKey } from "./api";
import { flushAttempts } from "./offline-attempts";
import { DashboardView } from "./learning/dashboard-view";
import { AdvancedExamResultView } from "./learning/advanced-exam-result-view";
import { LessonView } from "./learning/lesson-view";
import { PlacementView } from "./learning/placement-view";
import { ReviewsView } from "./learning/reviews-view";
import { styles } from "./learning/styles";
import { SummaryView } from "./learning/summary-view";
import {
  useCompleteLesson,
  useLearningDashboard,
  useRateReview,
  useReviews,
  useStartLesson,
  useStartC1Exam,
  useStartPlacement,
  useSubmitPlacement,
  useSubmitC1Exam,
} from "./queries/learning";

type ViewName =
  | "dashboard"
  | "placement"
  | "lesson"
  | "summary"
  | "reviews"
  | "c1-result";

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
  const [summaryScore, setSummaryScore] = useState(0);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const pendingLessonStarts = useRef(new Map<string, string>());

  const startPlacementMutation = useStartPlacement(token);
  const submitPlacementMutation = useSubmitPlacement(token);
  const startC1ExamMutation = useStartC1Exam(token);
  const submitC1ExamMutation = useSubmitC1Exam(token);
  const startLessonMutation = useStartLesson(token);
  const completeLessonMutation = useCompleteLesson(token);
  const reviewsQuery = useReviews(token, language);
  const rateReviewMutation = useRateReview(token);

  useEffect(() => {
    if (dashboardQuery.isError) setMessage(copy.learningError);
  }, [dashboardQuery.isError, copy.learningError]);

  // Flush any offline-queued attempts once the dashboard has loaded for the
  // first time, matching the previous post-load flush in loadDashboard().
  const initialFlushDone = useRef(false);
  useEffect(() => {
    if (!dashboardQuery.isSuccess || initialFlushDone.current) return;
    initialFlushDone.current = true;
    void flushAttempts(token).then((flushed) => {
      if (flushed.rejected > 0) setMessage(copy.offlineRejected);
    });
  }, [dashboardQuery.isSuccess, token, copy.offlineRejected]);

  const returnToDashboard = async () => {
    setView("dashboard");
    await dashboardQuery.refetch();
    const flushed = await flushAttempts(token);
    if (flushed.rejected > 0) setMessage(copy.offlineRejected);
  };

  const startPlacement = () => {
    if (startPlacementMutation.isPending) return;
    setMessage(null);
    startPlacementMutation.mutate(
      {
        language,
        interfaceLocale: locale,
        idempotencyKey: idempotencyKey(
          "placement",
          "attempt",
          language,
          Date.now().toString(),
        ),
      },
      {
        onSuccess: (result) => {
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
    startC1ExamMutation.mutate(
      {
        interfaceLocale: locale,
        idempotencyKey: idempotencyKey(
          "c1-exam",
          "attempt",
          Date.now().toString(),
        ),
      },
      {
        onSuccess: (result) => {
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
    const intent = `${courseSlug}:${lessonSlug}`;
    const requestKey =
      pendingLessonStarts.current.get(intent) ??
      idempotencyKey("lesson", lessonSlug, Date.now().toString());
    pendingLessonStarts.current.set(intent, requestKey);
    setMessage(null);
    startLessonMutation.mutate(
      {
        courseSlug,
        lessonSlug,
        interfaceLocale: locale,
        idempotencyKey: requestKey,
      },
      {
        onSuccess: (result) => {
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
                setSummaryScore(completion.score);
                setView("summary");
              },
              onError: () => setMessage(copy.learningError),
            });
            return;
          }
          setExerciseIndex(firstUnanswered);
          setView("lesson");
        },
        onError: () => setMessage(copy.learningError),
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
        setSummaryScore(result.score);
        setView("summary");
      },
      onError: () => setMessage(copy.learningError),
    });
  };

  const openReviews = async () => {
    setMessage(null);
    const result = await reviewsQuery.refetch();
    if (result.data) {
      setReviews(result.data);
      setView("reviews");
    } else {
      setMessage(copy.learningError);
    }
  };

  const rateReview = (rating: ReviewRating) => {
    const item = reviews[0];
    if (!item || rateReviewMutation.isPending) return;
    rateReviewMutation.mutate(
      {
        itemId: item.id,
        rating,
        idempotencyKey: idempotencyKey(
          "review",
          item.id,
          item.repetitions.toString(),
        ),
      },
      {
        onSuccess: () => setReviews((items) => items.slice(1)),
        onError: () => setMessage(copy.learningError),
      },
    );
  };

  if (dashboardQuery.isLoading)
    return <ActivityIndicator color={colors.actionPrimary} />;

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
          token={token}
          locale={locale}
          copy={copy}
          lesson={lesson}
          exerciseIndex={exerciseIndex}
          onClose={() => setView("dashboard")}
          onAdvance={advanceLesson}
          onMessage={setMessage}
          completing={completeLessonMutation.isPending}
        />
      ) : null}

      {view === "summary" ? (
        <SummaryView
          summaryScore={summaryScore}
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
          reviews={reviews}
          copy={copy}
          onClose={() => setView("dashboard")}
          onRate={rateReview}
          disabled={rateReviewMutation.isPending}
        />
      ) : null}

      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}
