import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AdvancedExamResult,
  AdvancedExamSessionResponse,
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

import { ApiRequestError, apiRequest } from "../api";

/**
 * Loads the dashboard for the preferred language, falling back to the other
 * course language if the preferred one has no configured UserCourse yet.
 */
export function useLearningDashboard(
  token: string,
  preferredLanguage: CourseLanguage,
  interfaceLocale: InterfaceLocale,
) {
  return useQuery({
    queryKey: [
      "learning",
      "dashboard",
      token,
      preferredLanguage,
      interfaceLocale,
    ],
    queryFn: async () => {
      try {
        return {
          language: preferredLanguage,
          dashboard: await apiRequest<LearningDashboard>(
            `/learning/dashboard?language=${preferredLanguage}&interfaceLocale=${interfaceLocale}`,
            { token },
          ),
        };
      } catch (error) {
        if (
          !(error instanceof ApiRequestError) ||
          error.code !== "USER_COURSE_NOT_FOUND"
        )
          throw error;
        const fallbackLanguage: CourseLanguage =
          preferredLanguage === "en" ? "th" : "en";
        return {
          language: fallbackLanguage,
          dashboard: await apiRequest<LearningDashboard>(
            `/learning/dashboard?language=${fallbackLanguage}&interfaceLocale=${interfaceLocale}`,
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

export function useStartC1Exam(token: string) {
  return useMutation({
    mutationFn: (input: {
      interfaceLocale: InterfaceLocale;
      idempotencyKey: string;
    }) =>
      apiRequest<AdvancedExamSessionResponse>("/learning/c1-exam/start", {
        method: "POST",
        token,
        body: input,
      }),
  });
}

export function useSubmitC1Exam(token: string) {
  return useMutation({
    mutationFn: (input: {
      sessionId: string;
      answers: Array<{ questionId: string; selectedOptionId: string }>;
    }) =>
      apiRequest<AdvancedExamResult>(
        `/learning/c1-exam/${input.sessionId}/submit`,
        {
          method: "POST",
          token,
          body: { answers: input.answers },
        },
      ),
  });
}

export function useStartLesson(token: string) {
  return useMutation({
    mutationFn: (input: {
      courseSlug: string;
      lessonSlug: string;
      interfaceLocale: InterfaceLocale;
      idempotencyKey: string;
    }) =>
      apiRequest<LearningSessionResponse>(
        `/learning/lessons/${input.courseSlug}/${input.lessonSlug}/start`,
        {
          method: "POST",
          token,
          body: {
            idempotencyKey: input.idempotencyKey,
            interfaceLocale: input.interfaceLocale,
          },
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
