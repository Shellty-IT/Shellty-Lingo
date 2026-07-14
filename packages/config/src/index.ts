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

export const apiEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: runtimeEnvironmentSchema.default("development"),
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().max(65535).default(3001),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3002,http://localhost:8081")
    .transform((value) => value.split(",").map((origin) => origin.trim())),
  APP_VERSION: z.string().min(1).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SENTRY_DSN: optionalUrl,
  AUTH_ACCESS_TOKEN_SECRET: z
    .string()
    .min(32)
    .default("development-access-token-secret-change-me"),
  AUTH_REFRESH_TOKEN_SECRET: z
    .string()
    .min(32)
    .default("development-refresh-token-secret-change-me"),
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
    .default("development-billing-secret-change-me"),
  BILLING_SANDBOX_ENABLED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
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
