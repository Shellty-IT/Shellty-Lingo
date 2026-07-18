import { z } from "zod";

export const runtimeEnvironmentSchema = z.enum([
  "development",
  "test",
  "staging",
  "production",
]);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url().optional(),
);

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

export const aiProviderNames = ["gemini", "groq"] as const;
export type AiProviderName = (typeof aiProviderNames)[number];

const developmentSecrets = {
  access: "development-access-token-secret-change-me",
  refresh: "development-refresh-token-secret-change-me",
  billing: "development-billing-secret-change-me",
} as const;

const isHttpOrigin = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === value
    );
  } catch {
    return false;
  }
};

const isPlaceholderSecret = (value: string): boolean =>
  /(?:development|replace|change[_-]?me)/i.test(value);

export const apiEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    APP_ENV: runtimeEnvironmentSchema.default("development"),
    API_HOST: z.string().default("0.0.0.0"),
    API_PORT: z.coerce.number().int().positive().max(65535).default(3001),
    CORS_ORIGINS: z
      .string()
      .default("http://localhost:3002,http://localhost:8081")
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .refine(
        (origins) => origins.length > 0 && origins.every(isHttpOrigin),
        "CORS origins must be absolute HTTP(S) origins.",
      ),
    APP_VERSION: z.string().min(1).default("development"),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    SENTRY_DSN: optionalUrl,
    AUTH_ACCESS_TOKEN_SECRET: z
      .string()
      .min(32)
      .default(developmentSecrets.access),
    AUTH_REFRESH_TOKEN_SECRET: z
      .string()
      .min(32)
      .default(developmentSecrets.refresh),
    AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .min(60)
      .max(3600)
      .default(900),
    AUTH_REFRESH_TOKEN_TTL_DAYS: z.coerce
      .number()
      .int()
      .min(1)
      .max(90)
      .default(30),
    BILLING_WEBHOOK_SECRET: z
      .string()
      .min(32)
      .default(developmentSecrets.billing),
    BILLING_SANDBOX_ENABLED: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    AI_PROVIDER_ORDER: z
      .string()
      .default("gemini,groq")
      .transform((value) =>
        value
          .split(",")
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean),
      )
      .refine(
        (names) =>
          names.every((name) =>
            aiProviderNames.includes(name as AiProviderName),
          ),
        `AI_PROVIDER_ORDER may only contain: ${aiProviderNames.join(", ")}.`,
      )
      .transform((names) => names as AiProviderName[]),
    GEMINI_API_KEY: optionalSecret,
    GEMINI_MODEL: z.string().min(1).default("gemini-2.0-flash"),
    GROQ_API_KEY: optionalSecret,
    GROQ_MODEL: z.string().min(1).default("llama-3.3-70b-versatile"),
    AI_REQUEST_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .min(1000)
      .max(60000)
      .default(20000),
    AI_MAX_RETRIES: z.coerce.number().int().min(0).max(3).default(1),
    AI_DAILY_BUDGET_USD: z.coerce.number().positive().max(1000).default(8),
    AI_TRANSLATION_ENABLED: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
  })
  .superRefine((environment, context) => {
    if (
      !(["staging", "production"] as const).includes(
        environment.APP_ENV as "staging" | "production",
      )
    )
      return;

    const secrets = [
      ["AUTH_ACCESS_TOKEN_SECRET", environment.AUTH_ACCESS_TOKEN_SECRET],
      ["AUTH_REFRESH_TOKEN_SECRET", environment.AUTH_REFRESH_TOKEN_SECRET],
      ["BILLING_WEBHOOK_SECRET", environment.BILLING_WEBHOOK_SECRET],
    ] as const;
    for (const [field, value] of secrets) {
      if (isPlaceholderSecret(value))
        context.addIssue({
          code: "custom",
          path: [field],
          message: "A non-placeholder deployment secret is required.",
        });
    }
    if (
      environment.APP_ENV === "production" &&
      environment.BILLING_SANDBOX_ENABLED
    )
      context.addIssue({
        code: "custom",
        path: ["BILLING_SANDBOX_ENABLED"],
        message: "Billing sandbox must be disabled in production.",
      });
    if (
      environment.CORS_ORIGINS.some((origin) => !origin.startsWith("https://"))
    )
      context.addIssue({
        code: "custom",
        path: ["CORS_ORIGINS"],
        message: "Deployment CORS origins must use HTTPS.",
      });
    const providerKeys: Record<AiProviderName, string | undefined> = {
      gemini: environment.GEMINI_API_KEY,
      groq: environment.GROQ_API_KEY,
    };
    for (const provider of environment.AI_PROVIDER_ORDER) {
      if (!providerKeys[provider])
        context.addIssue({
          code: "custom",
          path: ["AI_PROVIDER_ORDER"],
          message: `AI provider "${provider}" is listed but its API key is missing.`,
        });
    }
  });

export type ApiEnvironment = z.infer<typeof apiEnvironmentSchema>;

export function parseApiEnvironment(
  input: Record<string, string | undefined>,
): ApiEnvironment {
  const result = apiEnvironmentSchema.safeParse(input);
  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(`Invalid API environment variables: ${fields}`);
  }
  return result.data;
}
