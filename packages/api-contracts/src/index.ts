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

export const thaiUnitKinds = [
  "consonant",
  "vowel",
  "syllable",
  "digit",
  "tone_rule",
] as const;
export type ThaiUnitKind = (typeof thaiUnitKinds)[number];

export interface ThaiScriptUnit {
  id: string;
  kind: ThaiUnitKind;
  glyph: string;
  name: string;
  transliteration: string;
  meaning: string;
  toneClass?: "low" | "mid" | "high";
  tone?: "mid" | "low" | "falling" | "high" | "rising";
  audioUrl?: string;
  example: { thai: string; transliteration: string; translation: string };
}

export interface ThaiPathResponse {
  transliterationVisible: boolean;
  transliterationFadePercent: number;
  disclaimer: string;
  units: ThaiScriptUnit[];
}

export const correctionModes = [
  "after_each_message",
  "important_only",
  "after_conversation",
  "no_corrections",
] as const;
export type CorrectionMode = (typeof correctionModes)[number];

export interface ConversationScenario {
  id: string;
  title: string;
  description: string;
  role: string;
  level: string;
  estimatedMinutes: number;
}

export interface ConversationSessionResponse {
  id: string;
  scenario: ConversationScenario;
  correctionMode: CorrectionMode;
  status: "active" | "completed" | "blocked";
  remainingMessages: number;
  messages: Array<{
    id: string;
    role: "learner" | "assistant";
    text: string;
    correction?: { original: string; corrected: string; explanation: string };
    createdAt: string;
  }>;
}

export interface ConversationSummary {
  conversationId: string;
  headline: string;
  strengths: string[];
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  newWords: Array<{ term: string; translation: string }>;
  recommendation: string;
}

export type TodayPlanItemKind = "review" | "lesson" | "thai" | "conversation";
export interface TodayPlanResponse {
  language: CourseLanguage;
  generatedBy: "deterministic" | "ai_recommended";
  dailyMinutes: number;
  totalMinutes: number;
  completedItems: number;
  items: Array<{
    id: string;
    kind: TodayPlanItemKind;
    title: string;
    detail: string;
    minutes: number;
    completed: boolean;
    action: string;
  }>;
}

export interface ProgressDashboardResponse {
  language: CourseLanguage;
  level: string;
  explanation: string;
  metrics: {
    minutes: number;
    lessonsCompleted: number;
    wordsLearned: number;
    accuracyPercent: number;
    streakDays: number;
    weeklyGoalMinutes: number;
    weeklyMinutes: number;
  };
  commonErrors: Array<{ label: string; count: number }>;
  badges: Array<{ id: string; title: string; earned: boolean }>;
  lastSevenDays: Array<{ date: string; minutes: number }>;
}

export const notificationKinds = [
  "learning_reminder",
  "review_due",
  "product_updates",
] as const;
export type NotificationKind = (typeof notificationKinds)[number];

export interface NotificationPreferenceContract {
  kind: NotificationKind;
  enabled: boolean;
  localTime: string;
  timezone: string;
  quietHours: { start: string; end: string };
}

export interface PrivacySettingsResponse {
  policyVersion: string;
  termsVersion: string;
  conversationRetentionDays: number;
  diagnosticLogRetentionDays: number;
  exportLinkRetentionHours: number;
  preferences: NotificationPreferenceContract[];
}

export type BillingStore = "apple" | "google";
export type PlanCode = "free" | "premium";
export type SubscriptionStatus =
  | "active"
  | "grace_period"
  | "expired"
  | "refunded"
  | "cancelled";

export interface BillingProduct {
  id: "shellty_premium_monthly" | "shellty_premium_annual";
  title: string;
  period: "month" | "year";
  displayPrice: string;
  trialDays: number;
}

export interface PlanAccessResponse {
  plan: PlanCode;
  status: SubscriptionStatus | "none";
  renewsAt: string | null;
  store: BillingStore | null;
  entitlements: string[];
  limits: {
    aiMessagesPerDay: number;
    aiMessagesUsedToday: number;
    premiumLessons: boolean;
  };
}

export interface BillingCatalogResponse {
  products: BillingProduct[];
  access: PlanAccessResponse;
}
