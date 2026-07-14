export const CORRELATION_ID_HEADER = "x-correlation-id" as const;

export type HealthStatus = "ok" | "degraded";

export interface HealthResponse {
  service: "shellty-lingo-api";
  status: HealthStatus;
  database: "connected" | "not-checked" | "unavailable";
  environment: "development" | "test" | "staging" | "production";
  version: string;
  timestamp: string;
  correlationId: string;
}
