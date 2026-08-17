import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  CourseLanguage,
  ListeningAttemptResponse,
  ListeningChallenge,
} from "@shellty/api-contracts";
import type { Locale } from "@shellty/i18n";

import { apiRequest } from "../api";

export function useListeningChallenges(
  token: string,
  language: CourseLanguage,
  locale: Locale,
) {
  return useQuery({
    queryKey: ["listening", "challenges", token, language, locale],
    queryFn: () =>
      apiRequest<ListeningChallenge[]>(
        `/growth/listening/challenges?language=${language}&locale=${locale}`,
        { token },
      ),
  });
}

export function useListeningAttempt(token: string) {
  return useMutation({
    mutationFn: (input: {
      challengeId: string;
      optionId: string;
      idempotencyKey: string;
      interfaceLocale: Locale;
    }) =>
      apiRequest<ListeningAttemptResponse>(
        `/growth/listening/challenges/${input.challengeId}/attempts`,
        {
          method: "POST",
          token,
          body: {
            optionId: input.optionId,
            idempotencyKey: input.idempotencyKey,
            interfaceLocale: input.interfaceLocale,
          },
        },
      ),
  });
}
