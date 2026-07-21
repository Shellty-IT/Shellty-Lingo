import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  CourseLanguage,
  ListeningAttemptResponse,
  ListeningChallenge,
} from "@shellty/api-contracts";

import { apiRequest } from "../api";

export function useListeningChallenges(
  token: string,
  language: CourseLanguage,
) {
  return useQuery({
    queryKey: ["listening", "challenges", token, language],
    queryFn: () =>
      apiRequest<ListeningChallenge[]>(
        `/growth/listening/challenges?language=${language}`,
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
    }) =>
      apiRequest<ListeningAttemptResponse>(
        `/growth/listening/challenges/${input.challengeId}/attempts`,
        {
          method: "POST",
          token,
          body: {
            optionId: input.optionId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      ),
  });
}
