import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ConversationScenario,
  ConversationSessionResponse,
  ConversationSummary,
  ConversationTurnResponse,
  CorrectionMode,
  CourseLanguage,
  InterfaceLocale,
  ProgressDashboardResponse,
  ThaiPathResponse,
  TodayPlanResponse,
} from "@shellty/api-contracts";

import { apiRequest } from "../api";

export function useTodayPlan(
  token: string,
  language: CourseLanguage,
  locale: InterfaceLocale,
) {
  return useQuery({
    queryKey: ["growth", "today", token, language, locale],
    queryFn: () =>
      apiRequest<TodayPlanResponse>(
        `/growth/today?language=${language}&locale=${locale}`,
        { token },
      ),
  });
}

export function useProgress(
  token: string,
  language: CourseLanguage,
  locale: InterfaceLocale,
) {
  return useQuery({
    queryKey: ["growth", "progress", token, language, locale],
    queryFn: () =>
      apiRequest<ProgressDashboardResponse>(
        `/growth/progress?language=${language}&locale=${locale}`,
        { token },
      ),
  });
}

export function useScenarios(token: string, language: CourseLanguage) {
  return useQuery({
    queryKey: ["growth", "scenarios", token, language],
    queryFn: () =>
      apiRequest<ConversationScenario[]>(
        `/growth/conversations/scenarios?language=${language}`,
        { token },
      ),
  });
}

export function useThaiPath(token: string, enabled: boolean) {
  return useQuery({
    queryKey: ["growth", "thai-path", token],
    queryFn: () => apiRequest<ThaiPathResponse>("/growth/thai/path", { token }),
    enabled,
  });
}

export function useToggleTransliteration(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest("/growth/thai/transliteration", {
        method: "PATCH",
        token,
        body: { enabled },
      }),
    // Optimistic: the toggle must flip instantly, matching the prior
    // behaviour of updating local state before the PATCH resolved.
    onMutate: (enabled) => {
      queryClient.setQueryData<ThaiPathResponse | undefined>(
        ["growth", "thai-path", token],
        (current) =>
          current
            ? {
                ...current,
                transliterationVisible: enabled,
                transliterationFadePercent: enabled ? 100 : 0,
              }
            : current,
      );
    },
  });
}

export function useStartConversation(token: string) {
  return useMutation({
    mutationFn: (input: {
      language: CourseLanguage;
      scenarioId: string;
      correctionMode: CorrectionMode;
      idempotencyKey: string;
    }) =>
      apiRequest<ConversationSessionResponse>("/growth/conversations", {
        method: "POST",
        token,
        body: input,
      }),
  });
}

export function useConversation(token: string, conversationId: string | null) {
  return useQuery({
    queryKey: ["growth", "conversation", token, conversationId],
    queryFn: () =>
      apiRequest<ConversationSessionResponse>(
        `/growth/conversations/${conversationId}`,
        { token },
      ),
    enabled: Boolean(conversationId),
  });
}

export function useSendMessage(token: string, conversationId: string) {
  return useMutation({
    mutationFn: (input: { text: string; idempotencyKey: string }) =>
      apiRequest<ConversationTurnResponse>(
        `/growth/conversations/${conversationId}/messages`,
        { method: "POST", token, body: input },
      ),
  });
}

export function useCompleteConversation(token: string, conversationId: string) {
  return useMutation({
    mutationFn: (locale: InterfaceLocale) =>
      apiRequest<ConversationSummary>(
        `/growth/conversations/${conversationId}/complete`,
        { method: "POST", token, body: { locale } },
      ),
  });
}

export function useReportConversation(token: string, conversationId: string) {
  return useMutation({
    mutationFn: () =>
      apiRequest(`/growth/conversations/${conversationId}/reports`, {
        method: "POST",
        token,
        body: { reason: "quality" },
      }),
  });
}
