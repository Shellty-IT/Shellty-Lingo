import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  ContextDictionaryResult,
  CourseLanguage,
  ExerciseAttemptResult,
  InterfaceLocale,
  LearningDashboard,
  LearningSessionResponse,
  PlacementSessionResponse,
  ReviewQueueItem,
  ReviewRating,
} from "@shellty/api-contracts";

import { apiRequest } from "../api";

/**
 * Loads the dashboard for the preferred language, falling back to the other
 * course language if the preferred one has no configured UserCourse yet.
 */
export function useLearningDashboard(
  token: string,
  preferredLanguage: CourseLanguage,
) {
  return useQuery({
    queryKey: ["learning", "dashboard", token, preferredLanguage],
    queryFn: async () => {
      try {
        return {
          language: preferredLanguage,
          dashboard: await apiRequest<LearningDashboard>(
            `/learning/dashboard?language=${preferredLanguage}`,
            { token },
          ),
        };
      } catch {
        const fallbackLanguage: CourseLanguage =
          preferredLanguage === "en" ? "th" : "en";
        return {
          language: fallbackLanguage,
          dashboard: await apiRequest<LearningDashboard>(
            `/learning/dashboard?language=${fallbackLanguage}`,
            { token },
          ),
        };
      }
    },
  });
}

export function useStartPlacement(token: string) {
  return useMutation({
    mutationFn: (input: {
      language: CourseLanguage;
      interfaceLocale: InterfaceLocale;
      idempotencyKey: string;
    }) =>
      apiRequest<PlacementSessionResponse>("/learning/placement/start", {
        method: "POST",
        token,
        body: input,
      }),
  });
}

export function useSubmitPlacement(token: string) {
  return useMutation({
    mutationFn: (input: {
      sessionId: string;
      answers: Array<{ questionId: string; selectedOptionId: string }>;
    }) =>
      apiRequest(`/learning/placement/${input.sessionId}/submit`, {
        method: "POST",
        token,
        body: { answers: input.answers },
      }),
  });
}

export function useStartLesson(token: string) {
  return useMutation({
    mutationFn: (input: {
      courseSlug: string;
      lessonSlug: string;
      idempotencyKey: string;
    }) =>
      apiRequest<LearningSessionResponse>(
        `/learning/lessons/${input.courseSlug}/${input.lessonSlug}/start`,
        {
          method: "POST",
          token,
          body: { idempotencyKey: input.idempotencyKey },
        },
      ),
  });
}

export function useSubmitAnswer(token: string) {
  return useMutation({
    mutationFn: (input: {
      sessionId: string;
      exerciseId: string;
      answer: unknown;
      idempotencyKey: string;
    }) =>
      apiRequest<ExerciseAttemptResult>(
        `/learning/sessions/${input.sessionId}/attempts`,
        {
          method: "POST",
          token,
          body: {
            exerciseId: input.exerciseId,
            answer: input.answer,
            idempotencyKey: input.idempotencyKey,
          },
        },
      ),
  });
}

export function useCompleteLesson(token: string) {
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest<{ score: number; dueReviews: number }>(
        `/learning/sessions/${sessionId}/complete`,
        { method: "POST", token },
      ),
  });
}

export function useDictionaryLookup(token: string) {
  return useMutation({
    mutationFn: (input: {
      exerciseId: string;
      selection: string;
      targetLocale: InterfaceLocale;
    }) =>
      apiRequest<ContextDictionaryResult>("/learning/dictionary", {
        method: "POST",
        token,
        body: input,
      }),
  });
}

export function useSaveDictionary(token: string) {
  return useMutation({
    mutationFn: (input: {
      exerciseId: string;
      selection: string;
      targetLocale: InterfaceLocale;
    }) =>
      apiRequest("/learning/dictionary/save", {
        method: "POST",
        token,
        body: input,
      }),
  });
}

/** Lazily fetched on demand (user opens the review queue), not eagerly. */
export function useReviews(token: string, language: CourseLanguage) {
  return useQuery({
    queryKey: ["learning", "reviews", token, language],
    queryFn: () =>
      apiRequest<ReviewQueueItem[]>(`/learning/reviews?language=${language}`, {
        token,
      }),
    enabled: false,
  });
}

export function useRateReview(token: string) {
  return useMutation({
    mutationFn: (input: {
      itemId: string;
      rating: ReviewRating;
      idempotencyKey: string;
    }) =>
      apiRequest(`/learning/reviews/${input.itemId}`, {
        method: "POST",
        token,
        body: { rating: input.rating, idempotencyKey: input.idempotencyKey },
      }),
  });
}
