import { describe, expect, it } from "vitest";

import { parseApiEnvironment } from "./index";

describe("parseApiEnvironment", () => {
  it("rejects incomplete media storage credentials", () => {
    expect(() =>
      parseApiEnvironment({
        DATABASE_URL: "postgresql://shellty:test@localhost:5432/test",
        MEDIA_S3_ACCESS_KEY_ID: "key",
      }),
    ).toThrow("Invalid API environment variables: MEDIA_S3_ACCESS_KEY_ID");
  });
  it("allows optional storage with a server credential chain", () => {
    const env = parseApiEnvironment({
      DATABASE_URL: "postgresql://shellty:test@localhost:5432/test",
      MEDIA_S3_BUCKET: "private-lessons",
    });
    expect(env.MEDIA_S3_REGION).toBe("us-east-1");
    expect(env.MEDIA_S3_ACCESS_KEY_ID).toBeUndefined();
  });
  it("parses a complete local environment", () => {
    const env = parseApiEnvironment({
      DATABASE_URL:
        "postgresql://shellty:password@localhost:5432/shellty_lingo",
    });
    expect(env.APP_ENV).toBe("development");
    expect(env.API_PORT).toBe(3001);
    expect(env.CORS_ORIGINS).toContain("http://localhost:3002");
  });

  it("applies AI defaults and allows a keyless development chain", () => {
    const env = parseApiEnvironment({
      DATABASE_URL:
        "postgresql://shellty:password@localhost:5432/shellty_lingo",
    });
    expect(env.AI_PROVIDER_ORDER).toEqual(["groq", "gemini"]);
    expect(env.GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(env.GEMINI_SPEECH_MODEL).toBe("gemini-3.6-flash");
    expect(env.GROQ_MODEL).toBe("openai/gpt-oss-120b");
    expect(env.AI_TUTOR_GROQ_FALLBACK_MODELS).toEqual(["openai/gpt-oss-20b"]);
    expect(env.AI_TUTOR_GEMINI_FALLBACK_MODELS).toEqual([
      "gemini-3.5-flash-lite",
    ]);
    expect(env.AI_TUTOR_TIMEOUT_MS).toBe(24000);
    expect(env.AI_REQUEST_TIMEOUT_MS).toBe(20000);
    expect(env.AI_DAILY_BUDGET_USD).toBe(8);
    expect(env.AI_TRANSLATION_ENABLED).toBe(true);
  });

  it("rejects an unknown AI provider name", () => {
    expect(() =>
      parseApiEnvironment({
        DATABASE_URL:
          "postgresql://shellty:password@localhost:5432/shellty_lingo",
        AI_PROVIDER_ORDER: "gemini,openai",
      }),
    ).toThrow("Invalid API environment variables: AI_PROVIDER_ORDER");
  });

  it("allows disabling extra tutor models and deduplicates configured lists", () => {
    const env = parseApiEnvironment({
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      AI_TUTOR_GROQ_FALLBACK_MODELS: "openai/gpt-oss-20b, openai/gpt-oss-20b",
      AI_TUTOR_GEMINI_FALLBACK_MODELS: "",
    });
    expect(env.AI_TUTOR_GROQ_FALLBACK_MODELS).toEqual(["openai/gpt-oss-20b"]);
    expect(env.AI_TUTOR_GEMINI_FALLBACK_MODELS).toEqual([]);
    expect(() =>
      parseApiEnvironment({
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        AI_TUTOR_TIMEOUT_MS: "30000",
      }),
    ).toThrow("AI_TUTOR_TIMEOUT_MS");
  });

  it("migrates retired provider model ids from an existing deployment", () => {
    const env = parseApiEnvironment({
      DATABASE_URL:
        "postgresql://shellty:password@localhost:5432/shellty_lingo",
      GEMINI_MODEL: "gemini-2.0-flash",
      GEMINI_SPEECH_MODEL: "gemini-2.0-flash",
      GROQ_MODEL: "llama-3.3-70b-versatile",
    });
    expect(env.GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(env.GEMINI_SPEECH_MODEL).toBe("gemini-3.6-flash");
    expect(env.GROQ_MODEL).toBe("openai/gpt-oss-120b");
  });

  it("requires a key for every AI provider listed in production", () => {
    expect(() =>
      parseApiEnvironment({
        APP_ENV: "staging",
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://test:test@db.example.com:5432/test",
        CORS_ORIGINS: "https://admin.staging.example.com",
        AUTH_ACCESS_TOKEN_SECRET: "a".repeat(48),
        AUTH_REFRESH_TOKEN_SECRET: "b".repeat(48),
        BILLING_WEBHOOK_SECRET: "c".repeat(48),
        AI_PROVIDER_ORDER: "groq",
      }),
    ).toThrow("Invalid API environment variables: AI_PROVIDER_ORDER");
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
        AI_PROVIDER_ORDER: "",
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
      AI_PROVIDER_ORDER: "groq",
      GROQ_API_KEY: "gsk-staging-example-key",
    });
    expect(environment.BILLING_SANDBOX_ENABLED).toBe(false);
    expect(environment.AI_PROVIDER_ORDER).toEqual(["groq"]);
  });
});
