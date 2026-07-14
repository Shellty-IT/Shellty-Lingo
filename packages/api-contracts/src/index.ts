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

export const contentStatuses = [
  "draft",
  "review",
  "published",
  "archived",
] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const exerciseTypes = [
  "single_choice",
  "multiple_choice",
  "matching",
  "gap_fill",
  "typed_answer",
  "ordering",
  "listening",
] as const;
export type ExerciseType = (typeof exerciseTypes)[number];

export interface ExerciseContract {
  id: string;
  type: ExerciseType;
  prompt: string;
  instructions?: string;
  options?: Array<{ id: string; text: string }>;
  answer: unknown;
  explanation?: string;
  mediaAssetId?: string;
}

export interface PublishedLesson {
  course: { slug: string; language: CourseLanguage; level: string };
  module: { slug: string; title: string; position: number };
  lesson: {
    slug: string;
    title: string;
    summary: string | null;
    estimatedMinutes: number;
    version: number;
  };
  exercises: ExerciseContract[];
}
