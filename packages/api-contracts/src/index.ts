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

export const userRoles = ["learner", "editor", "admin"] as const;
export type UserRole = (typeof userRoles)[number];
export const interfaceLocales = ["pl", "en", "th"] as const;
export type InterfaceLocale = (typeof interfaceLocales)[number];
export const courseLanguages = ["en", "th"] as const;
export type CourseLanguage = (typeof courseLanguages)[number];

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  profile: {
    displayName: string | null;
    interfaceLocale: InterfaceLocale;
    onboardingCompleted: boolean;
  };
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
export interface ApiError {
  error: { code: string; message: string; correlationId?: string };
}
