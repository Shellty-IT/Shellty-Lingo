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
  exercises: Array<Omit<ExerciseContract, "answer">>;
}

export const reviewRatings = ["again", "hard", "good", "easy"] as const;
export type ReviewRating = (typeof reviewRatings)[number];

export interface LearnerExercise extends Omit<
  ExerciseContract,
  "answer" | "explanation"
> {
  position: number;
}

export interface PlacementQuestion {
  id: string;
  skill: "vocabulary" | "grammar" | "listening";
  prompt: string;
  options: Array<{ id: string; text: string }>;
}

export interface PlacementSessionResponse {
  sessionId: string;
  language: CourseLanguage;
  questions: PlacementQuestion[];
  resumed: boolean;
}

export interface PlacementResult {
  sessionId: string;
  score: number;
  correct: number;
  total: number;
  level: "A1" | "A2" | "B1";
}

export interface LearningSessionResponse {
  sessionId: string;
  resumed: boolean;
  lesson: {
    slug: string;
    title: string;
    summary: string | null;
    estimatedMinutes: number;
  };
  course: { slug: string; language: CourseLanguage; level: string };
  exercises: LearnerExercise[];
  attempts: Array<{
    exerciseId: string;
    correct: boolean;
    score: number;
  }>;
}

export interface ExerciseAttemptResult {
  attemptId: string;
  exerciseId: string;
  correct: boolean;
  score: number;
  feedback: { explanation?: string; expected?: unknown };
  alreadyRecorded: boolean;
}

export interface LearningDashboard {
  language: CourseLanguage;
  level: string;
  placementCompleted: boolean;
  dueReviews: number;
  courses: Array<{
    slug: string;
    title: string;
    level: string;
    modules: Array<{
      slug: string;
      title: string;
      lessons: Array<{
        slug: string;
        title: string;
        estimatedMinutes: number;
        status: string;
        bestScore: number;
      }>;
    }>;
  }>;
}

export interface ContextDictionaryResult {
  sourceKey: string;
  vocabularyId?: string;
  sourceLanguage: CourseLanguage;
  targetLocale: InterfaceLocale;
  sourceText: string;
  translation: string;
  definition: string;
  context: string;
  transliteration?: string;
  toneMarks?: string;
  speech: {
    source: { language: string; text: string };
    translation: { language: string; text: string };
  };
}

export interface ReviewQueueItem {
  id: string;
  sourceText: string;
  translation: string;
  context: string | null;
  dueAt: string;
  repetitions: number;
}

export interface ReviewResult {
  itemId: string;
  rating: ReviewRating;
  dueAt: string;
  intervalMinutes: number;
  alreadyRecorded: boolean;
}
