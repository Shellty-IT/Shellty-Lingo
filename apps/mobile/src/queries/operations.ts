import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NotificationKind,
  NotificationPreferenceContract,
  PrivacySettingsResponse,
} from "@shellty/api-contracts";

import { apiRequest } from "../api";

export function usePrivacySettings(token: string) {
  return useQuery({
    queryKey: ["operations", "privacy", token],
    queryFn: () =>
      apiRequest<PrivacySettingsResponse>("/operations/privacy", { token }),
  });
}

export function useToggleNotification(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      kind: NotificationKind;
      enabled: boolean;
      localTime: string;
      timezone: string;
      quietHoursStart: string;
      quietHoursEnd: string;
    }) =>
      apiRequest<NotificationPreferenceContract>("/operations/notifications", {
        method: "PATCH",
        token,
        body: input,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<PrivacySettingsResponse | undefined>(
        ["operations", "privacy", token],
        (current) =>
          current
            ? {
                ...current,
                preferences: current.preferences.map((item) =>
                  item.kind === updated.kind ? updated : item,
                ),
              }
            : current,
      );
    },
  });
}
