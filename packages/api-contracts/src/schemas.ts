import { z } from "zod";

import { courseLanguages, interfaceLocales } from "./index";

/**
 * Request schemas shared by the API (boundary validation) and clients (form
 * validation). The API applies them through its validation pipe, so a service
 * receiving an inferred type can rely on the values being normalized already.
 */

export const interfaceLocaleSchema = z.enum(interfaceLocales);
export const courseLanguageSchema = z.enum(courseLanguages);

// Deliberately loose (same shape the API accepted historically) so accounts
// registered earlier can still log in; tightening requires a data migration.
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(320)
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email.");

const displayNameSchema = z.string().trim().max(100);

const isTimezone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
};

export const timezoneSchema = z
  .string()
  .max(100)
  .refine(isTimezone, "Unknown IANA timezone.");

export const registerRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(12).max(128),
  displayName: displayNameSchema.optional(),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

// Login only checks shape; length rules would leak the password policy as an
// oracle. Wrong credentials must always surface as INVALID_CREDENTIALS.
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(1024),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1).max(200),
});
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1).max(200).optional(),
});
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;

export const updateProfileRequestSchema = z.object({
  displayName: displayNameSchema.optional(),
  interfaceLocale: interfaceLocaleSchema.optional(),
  notificationsEnabled: z.boolean().optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const onboardingRequestSchema = z.object({
  locale: interfaceLocaleSchema,
  language: courseLanguageSchema,
  goal: z.string().trim().min(1).max(100),
  dailyMinutes: z
    .number()
    .optional()
    .transform((value) => Math.max(5, Math.min(120, Math.floor(value ?? 15)))),
  timezone: timezoneSchema,
});
export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
