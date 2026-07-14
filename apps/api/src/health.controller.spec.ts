import { describe, expect, it, vi } from "vitest";

import type { ApiEnvironment } from "@shellty/config";

import { CorrelationContext } from "./correlation";
import { HealthController } from "./health.controller";
import type { PrismaService } from "./prisma.service";

const environment: ApiEnvironment = {
  NODE_ENV: "test",
  APP_ENV: "test",
  API_HOST: "127.0.0.1",
  API_PORT: 3001,
  APP_VERSION: "test-build",
  CORS_ORIGINS: ["http://localhost:3002"],
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  LOG_LEVEL: "error",
  AUTH_ACCESS_TOKEN_SECRET: "test-access-token-secret-with-enough-length",
  AUTH_REFRESH_TOKEN_SECRET: "test-refresh-token-secret-with-enough-length",
  AUTH_ACCESS_TOKEN_TTL_SECONDS: 900,
  AUTH_REFRESH_TOKEN_TTL_DAYS: 30,
  BILLING_WEBHOOK_SECRET: "test-billing-secret-at-least-32-characters",
  BILLING_SANDBOX_ENABLED: true,
};

describe("HealthController", () => {
  it("reports liveness without querying PostgreSQL", () => {
    const checkConnection = vi.fn();
    const controller = new HealthController(
      { checkConnection } as unknown as PrismaService,
      environment,
      new CorrelationContext(),
    );

    expect(controller.live()).toMatchObject({
      status: "ok",
      database: "not-checked",
    });
    expect(checkConnection).not.toHaveBeenCalled();
  });

  it("reports readiness after a database query", async () => {
    const checkConnection = vi.fn().mockResolvedValue(undefined);
    const controller = new HealthController(
      { checkConnection } as unknown as PrismaService,
      environment,
      new CorrelationContext(),
    );

    await expect(controller.ready()).resolves.toMatchObject({
      status: "ok",
      database: "connected",
    });
  });

  it("returns a service-unavailable error when PostgreSQL cannot be reached", async () => {
    const controller = new HealthController(
      {
        checkConnection: vi
          .fn()
          .mockRejectedValue(new Error("connection refused")),
      } as unknown as PrismaService,
      environment,
      new CorrelationContext(),
    );

    await expect(controller.ready()).rejects.toThrow("Service Unavailable");
  });
});
