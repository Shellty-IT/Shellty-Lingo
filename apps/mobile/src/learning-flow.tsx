import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type {
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
  useStartPlacement,
  useSubmitPlacement,
} from "./queries/learning";

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
  const dashboardQuery = useLearningDashboard(token, preferredLanguage);
  const language = dashboardQuery.data?.language ?? preferredLanguage;

  const [placement, setPlacement] = useState<PlacementSessionResponse | null>(
    null,
  );
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placementAnswers, setPlacementAnswers] = useState<
    Record<string, string>
  >({});
  const [lesson, setLesson] = useState<LearningSessionResponse | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [summaryScore, setSummaryScore] = useState(0);
  const [reviews, setReviews] = useState<ReviewQueueItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const pendingLessonStarts = useRef(new Map<string, string>());

  const startPlacementMutation = useStartPlacement(token);
  const submitPlacementMutation = useSubmitPlacement(token);
  const startLessonMutation = useStartLesson(token);
  const completeLessonMutation = useCompleteLesson(token);
  const reviewsQuery = useReviews(token, language);
  const rateReviewMutation = useRateReview(token);

  useEffect(() => {
    if (dashboardQuery.isError) setMessage(copy.authError);
  }, [dashboardQuery.isError, copy.authError]);

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
    setMessage(null);
    startPlacementMutation.mutate(
      {
        language,
        interfaceLocale: locale,
        idempotencyKey: idempotencyKey("placement", "onboarding", language),
      },
      {
        onSuccess: (result) => {
          setPlacement(result);
          setPlacementIndex(0);
          setPlacementAnswers({});
          setView("placement");
        },
        onError: () => setMessage(copy.authError),
      },
    );
  };

  const finishPlacement = (skip = false) => {
    if (!placement) return;
    submitPlacementMutation.mutate(
      {
        sessionId: placement.sessionId,
        answers: skip
          ? []
          : Object.entries(placementAnswers).map(
              ([questionId, selectedOptionId]) => ({
                questionId,
                selectedOptionId,
              }),
            ),
      },
      {
        onSuccess: () => void returnToDashboard(),
        onError: () => setMessage(copy.authError),
      },
    );
  };

  const startLesson = (courseSlug: string, lessonSlug: string) => {
    const intent = `${courseSlug}:${lessonSlug}`;
    const requestKey =
      pendingLessonStarts.current.get(intent) ??
      idempotencyKey("lesson", lessonSlug, Date.now().toString());
    pendingLessonStarts.current.set(intent, requestKey);
    setMessage(null);
    startLessonMutation.mutate(
      { courseSlug, lessonSlug, idempotencyKey: requestKey },
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
          setExerciseIndex(firstUnanswered < 0 ? 0 : firstUnanswered);
          setView("lesson");
        },
        onError: () => setMessage(copy.authError),
      },
    );
  };

  const advanceLesson = () => {
    if (!lesson) return;
    if (exerciseIndex < lesson.exercises.length - 1) {
      setExerciseIndex((value) => value + 1);
      return;
    }
    completeLessonMutation.mutate(lesson.sessionId, {
      onSuccess: (result) => {
        setSummaryScore(result.score);
        setView("summary");
      },
      onError: () => setMessage(copy.authError),
    });
  };

  const openReviews = async () => {
    setMessage(null);
    const result = await reviewsQuery.refetch();
    if (result.data) {
      setReviews(result.data);
      setView("reviews");
    } else {
      setMessage(copy.authError);
    }
  };

  const rateReview = (rating: ReviewRating) => {
    const item = reviews[0];
    if (!item) return;
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
        onError: () => setMessage(copy.authError),
      },
    );
  };

  if (dashboardQuery.isLoading)
    return <ActivityIndicator color={colors.actionPrimary} />;

  const busy =
    startPlacementMutation.isPending ||
    submitPlacementMutation.isPending ||
    startLessonMutation.isPending ||
    completeLessonMutation.isPending;

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

      {view === "dashboard" && dashboardQuery.data ? (
        <DashboardView
          dashboard={dashboardQuery.data.dashboard}
          language={language}
          copy={copy}
          onStartPlacement={startPlacement}
          onOpenReviews={() => void openReviews()}
          onStartLesson={startLesson}
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
        />
      ) : null}

      {view === "summary" ? (
        <SummaryView
          summaryScore={summaryScore}
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
        />
      ) : null}

      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}
