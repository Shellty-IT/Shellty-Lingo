import { describe, expect, it } from "vitest";

import { parseApiEnvironment } from "./index";

describe("parseApiEnvironment", () => {
  it("parses a complete local environment", () => {
    const env = parseApiEnvironment({
      DATABASE_URL:
        "postgresql://shellty:password@localhost:5432/shellty_lingo",
    });
    expect(env.APP_ENV).toBe("development");
    expect(env.API_PORT).toBe(3001);
    expect(env.CORS_ORIGINS).toContain("http://localhost:3002");
  });

  it("reports invalid fields without leaking values", () => {
    expect(() => parseApiEnvironment({ DATABASE_URL: "secret" })).toThrow(
      "Invalid API environment variables: DATABASE_URL",
    );
  });

  it("fails closed for placeholder production secrets and sandbox billing", () => {
    expect(() =>
      parseApiEnvironment({
        APP_ENV: "production",
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://test:test@db.example.com:5432/test",
        CORS_ORIGINS: "https://admin.example.com",
        BILLING_SANDBOX_ENABLED: "true",
      }),
    ).toThrow(
      "Invalid API environment variables: AUTH_ACCESS_TOKEN_SECRET, AUTH_REFRESH_TOKEN_SECRET, BILLING_WEBHOOK_SECRET, BILLING_SANDBOX_ENABLED",
    );
  });

  it("accepts explicit staging secrets and HTTPS origins", () => {
    const environment = parseApiEnvironment({
      APP_ENV: "staging",
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://test:test@db.example.com:5432/test",
      CORS_ORIGINS: "https://admin.staging.example.com",
      AUTH_ACCESS_TOKEN_SECRET: "a".repeat(48),
      AUTH_REFRESH_TOKEN_SECRET: "b".repeat(48),
      BILLING_WEBHOOK_SECRET: "c".repeat(48),
    });
    expect(environment.BILLING_SANDBOX_ENABLED).toBe(false);
  });
});
