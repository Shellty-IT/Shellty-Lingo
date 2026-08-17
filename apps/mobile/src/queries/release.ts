import { useQuery } from "@tanstack/react-query";
import type {
  BetaTelemetryEvent,
  BetaTelemetryProperties,
  ReleaseConfigResponse,
} from "@shellty/api-contracts";

import { apiRequest } from "../api";

export function useReleaseConfig(token: string) {
  return useQuery({
    queryKey: ["release", "config", token],
    queryFn: () =>
      apiRequest<ReleaseConfigResponse>("/release/config", { token }),
  });
}

/** Fire-and-forget product analytics; failures never surface to the user. */
export function sendTelemetry(
  token: string,
  event: BetaTelemetryEvent,
  properties?: BetaTelemetryProperties,
): void {
  void apiRequest("/release/telemetry", {
    method: "POST",
    token,
    body: { event, properties },
  }).catch(() => undefined);
}
