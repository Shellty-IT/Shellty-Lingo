import type {
  CourseLanguage,
  InterfaceLocale,
  LearningLevel,
} from "./learning-values";
import type { AnswerNormalizationPolicy } from "./answer-policy";

export {
  courseLanguages,
  interfaceLocales,
  learningLevels,
  type CourseLanguage,
  type InterfaceLocale,
  type LearningLevel,
} from "./learning-values";

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

export interface UpdateCourseLevelResponse {
  language: CourseLanguage;
  level: LearningLevel;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  profile: {
    displayName: string | null;
    interfaceLocale: InterfaceLocale;
    activeCourseLanguage: CourseLanguage | null;
    onboardingCompleted: boolean;
  };
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
    correlationId?: string;
  };
}

export const contentStatuses = [
  "draft",
  "review",
  "published",
  "archived",
] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const courseCategories = [
  "general",
  "vocabulary",
  "grammar",
  "phrases",
  "business",
  "it",
] as const;
export type CourseCategory = (typeof courseCategories)[number];

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
  skillKey?: string;
  learningObjective?: string;
  /** A closed gap exercise presented as editing one highlighted fragment. */
  interaction?: {
    kind: "correct_fragment";
    before: string;
    fragment: string;
    after: string;
  };
  /** Question or sentence in the language being learned. */
  prompt: string;
  /** The same task explained in the learner's interface language. */
  promptTranslation?: string;
  instructions?: string;
  /** Locale of authored instructions; absent means legacy English content. */
  instructionsLocale?: InterfaceLocale;
  answerLanguage?: CourseLanguage;
  responseConstraints?: { selectionCount?: number };
  options?: Array<{ id: string; text: string; displayText?: string }>;
  answer: unknown;
  explanation?: string;
  mediaAssetId?: string;
}

export interface PublishedLesson {
  course: {
    slug: string;
    language: CourseLanguage;
    level: string;
    category: CourseCategory;
  };
  module: { slug: string; title: string; position: number };
  lesson: {
    slug: string;
    title: string;
    summary: string | null;
    estimatedMinutes: number;
    version: number;
  };
  /** Public catalogue payload; solutions are returned only after an attempt. */
  exercises: Array<Omit<ExerciseContract, "answer" | "explanation">>;
}

export const reviewRatings = ["again", "hard", "good", "easy"] as const;
export type ReviewRating = (typeof reviewRatings)[number];

export interface LearnerExercise extends Omit<
  ExerciseContract,
  "answer" | "explanation"
> {
  position: number;
  /** Two independent lists for a matching task; no answer association. */
  matching?: {
    left: Array<{ id: string; text: string }>;
    right: Array<{ id: string; text: string }>;
  };
}

export interface LessonAudioResponse {
  url: string;
  expiresAt: string;
}

export interface LessonCompletionResult {
  sessionId: string;
  score: number;
  correct: number;
  total: number;
  dueReviews: number;
  unresolvedCount?: number;
  independentlyCorrect?: number;
}

export interface PlacementQuestion {
  id: string;
  skill: "vocabulary" | "grammar" | "reading" | "listening";
  prompt: string;
  options: Array<{ id: string; text: string }>;
  /** Text played with TTS for listening questions. */
  audioText?: string;
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
  level: "A1" | "A2" | "B1" | "B2";
}

export interface AdvancedExamSessionResponse extends PlacementSessionResponse {
  targetLevel: "C1";
}

export interface AdvancedExamResult {
  sessionId: string;
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  level: "B2" | "C1";
  notification: { title: string; message: string };
}

export interface LearningSessionResponse {
  sessionId: string;
  /** Instruction and feedback locale frozen when this session was started. */
  interfaceLocale?: InterfaceLocale;
  resumed: boolean;
  lesson: {
    slug: string;
    title: string;
    summary: string | null;
    estimatedMinutes: number;
  };
  course: {
    slug: string;
    language: CourseLanguage;
    level: string;
    category: CourseCategory;
  };
  exercises: LearnerExercise[];
  attempts: Array<{
    exerciseId: string;
    correct: boolean;
    score: number;
  }>;
  /** Completed AI hints, restored when an active lesson is resumed. */
  hints: ExerciseTutorHintResult[];
}

export interface ExerciseAttemptResult {
  attemptId: string;
  exerciseId: string;
  correct: boolean;
  score: number;
  feedback: {
    experiment?: { version: string; cohort: "control" | "pilot" };
    assessment?: AnswerAssessmentMetadata;
    explanation?: string;
    /** Practical rule plus distinct examples generated for an open answer. */
    usageTip?: string;
    expected?: unknown;
    /** Correctly formatted sentence for ordering feedback; hidden until answer. */
    expectedText?: string;
    /** True when an AI model assessed this open-ended response. */
    dynamic?: boolean;
    /** True when the learner used tutor help or a reading alternative. */
    assisted?: boolean;
    practiceMode?: "listening" | "reading";
    /** Reading alternatives never count as evidence of listening. */
    listeningVerified?: boolean;
  };
  alreadyRecorded: boolean;
}

export interface ExerciseTutorHintResult {
  exerciseId: string;
  hint: string;
  focus: "meaning" | "grammar" | "vocabulary" | "word_order";
  /** False for a curated local hint when remote tutor models are unavailable. */
  dynamic: boolean;
}

export interface LearningDashboard {
  language: CourseLanguage;
  level: string;
  placementCompleted: boolean;
  c1ExamAvailable: boolean;
  c1ExamPassed: boolean;
  dueReviews: number;
  courses: Array<{
    slug: string;
    title: string;
    level: string;
    category: CourseCategory;
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
  contextExerciseId: string;
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
  /** True when the translation came from a live AI provider, not reviewed content. */
  dynamic?: boolean;
  speech: {
    source: { language: string; text: string };
    translation: { language: string; text: string };
  };
}

export interface ReviewQueueItem {
  id: string;
  /** Monotonic occurrence identity; unlike repetitions it never resets. */
  scheduleRevision: number;
  sourceText: string;
  exerciseType?: ExerciseType;
  answerLanguage?: CourseLanguage | InterfaceLocale;
  normalizationPolicy?: AnswerNormalizationPolicy;
  learningObjective?: string;
  /** Spoken prompt for listening reviews; hidden until the answer is revealed. */
  audioPrompt?: { language: CourseLanguage; text: string };
  /** Short answer or meaning retained for backwards-compatible clients. */
  translation: string | null;
  context: string | null;
  /** Localized teaching explanation shown after the learner answers. */
  explanation: string;
  /** Localized guidance on using the reviewed word or phrase. */
  usageTip: string;
  answer:
    | {
        mode: "single_choice" | "multiple_choice";
        options: Array<{ id: string; text: string }>;
        correctOptionIds: string[];
      }
    | {
        mode: "text";
        acceptedAnswers: string[];
        expectedAnswer: string;
      }
    | {
        /** Open writing permits many valid phrasings; the learner compares a model. */
        mode: "self_assess";
        acceptedAnswers: string[];
        expectedAnswer: string;
      };
  /** Exact intervals the scheduler will apply for each available self-rating. */
  ratingIntervalsMinutes: Record<ReviewRating, number>;
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

export interface ReviewBatchResponse {
  items: ReviewQueueItem[];
  size: 5 | 10;
  totalDue: number;
  remainingDue: number;
}

export interface RateReviewRequest {
  rating: ReviewRating;
  idempotencyKey: string;
  /** Optional only for clients released before occurrence-aware reviews. */
  expectedScheduleRevision?: number;
}

export interface ReviewAssessment {
  verdict: "correct" | "almost" | "incorrect" | "needs_review";
  assessment?: AnswerAssessmentMetadata;
  score: number;
  suggestedAnswer: string;
  explanation: string;
  usageTip: string;
  dynamic: boolean;
}

export interface AnswerAssessmentMetadata {
  status: "graded" | "needs_review";
  policyVersion: "answer-v2";
  rubricVersion: "communication-v1" | "reference-v1";
  answerLanguage: CourseLanguage | InterfaceLocale;
  source: "reference" | "ai" | "unavailable";
  provider?: string;
  model?: string;
  promptVersion?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
}

export interface ExerciseCorrectionResult {
  id: string;
  originalAttemptId: string;
  attemptOrdinal: 2;
  correct: boolean;
  score: number;
  assessment: AnswerAssessmentMetadata;
  alreadyRecorded: boolean;
  assisted: true;
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
  category: "everyday" | "business" | "it";
  title: string;
  description: string;
  /** Source material the learner reads before starting the role-play. */
  briefing: string;
  /** The learner's role and perspective in the scenario. */
  learnerRole: string;
  /** Concrete points the conversation should cover. */
  objectives: string[];
  /** First in-role message shown before the learner sends a turn. */
  openingLine: string;
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

export interface ConversationTurnResponse {
  message: {
    text: string;
    correction?: { original: string; corrected: string; explanation: string };
  };
  /** Shows whether a remote language model or the safe local fallback answered. */
  generatedBy: "ai" | "fallback";
  /** The reply split into short chunks, oldest first, for a typing reveal. */
  chunks: string[];
  remainingMessages: number;
}

export interface VoiceConversationTurnResponse {
  transcript: string;
  assessment: {
    status: "understood" | "needs_attention";
    /** Acoustic confidence when the speech provider exposes it. */
    confidence?: number;
  };
  turn: ConversationTurnResponse;
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
  completedMinutes: number;
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

export const featureFlagKeys = [
  "ai_conversations",
  "listening_lab",
  "async_speaking",
  "realtime_voice",
  "thai_tone_analysis",
  "offline_mode",
  "social_features",
  "learning_pilot",
  "information_gap",
] as const;
export type FeatureFlagKey = (typeof featureFlagKeys)[number];

export interface FeatureFlagContract {
  key: FeatureFlagKey;
  enabled: boolean;
  rolloutPercent: number;
  available: boolean;
  reason: string;
}

export interface ReleaseConfigResponse {
  channel: "development" | "staging" | "production";
  beta: boolean;
  flags: FeatureFlagContract[];
}

export const betaTelemetryEvents = [
  "app_opened",
  "onboarding_started",
  "onboarding_step_completed",
  "onboarding_completed",
  "today_plan_viewed",
  "today_plan_item_selected",
  "course_switched",
  "review_session_opened",
  "conversation_started",
  "dictionary_opened",
  "lesson_exited",
  "first_lesson_completed",
  "first_conversation_completed",
  "listening_started",
  "listening_completed",
  "exercise_presented",
  "exercise_result_received",
  "lesson_start_timing",
  "audio_problem",
  "review_batch_completed",
  "learning_comfort",
] as const;
export type BetaTelemetryEvent = (typeof betaTelemetryEvents)[number];

export const betaTelemetryPropertyKeys = {
  app_opened: ["language", "locale"],
  onboarding_started: ["locale"],
  onboarding_step_completed: ["step", "language", "locale"],
  onboarding_completed: ["language", "locale", "dailyMinutes", "goal"],
  today_plan_viewed: [
    "language",
    "itemCount",
    "completedItems",
    "completedMinutes",
    "dailyMinutes",
    "totalMinutes",
  ],
  today_plan_item_selected: ["language", "kind", "position", "minutes"],
  course_switched: ["fromLanguage", "language", "source"],
  review_session_opened: ["language", "queueSize"],
  conversation_started: ["language", "scenarioId", "correctionMode"],
  dictionary_opened: ["language", "source", "dynamic"],
  lesson_exited: ["language", "progressPercent", "hadAnswer"],
  first_lesson_completed: ["language"],
  first_conversation_completed: ["language", "scenarioId"],
  listening_started: ["language"],
  listening_completed: ["language"],
  exercise_presented: [
    "language",
    "locale",
    "level",
    "exerciseType",
    "exerciseId",
    "sessionId",
  ],
  exercise_result_received: [
    "language",
    "exerciseType",
    "exerciseId",
    "sessionId",
    "durationMs",
    "status",
  ],
  lesson_start_timing: ["language", "durationMs"],
  audio_problem: ["language", "exerciseId", "source"],
  review_batch_completed: ["language", "size", "skipped"],
  learning_comfort: ["language", "rating", "source"],
} as const satisfies Record<BetaTelemetryEvent, readonly string[]>;

export type BetaTelemetryProperties = Record<
  string,
  string | number | boolean | null
>;

export interface BetaReadinessResponse {
  generatedAt: string;
  windowDays: number;
  sampleSize: number;
  metrics: {
    activationPercent: number;
    firstLessonCompletionPercent: number;
    firstConversationCompletionPercent: number;
    retentionD1Percent: number;
    retentionD7Percent: number;
    aiReportPercent: number;
    crashFreePercent: number | null;
  };
  gates: Array<{
    key: string;
    label: string;
    status: "pass" | "warning" | "blocked" | "needs_data";
    value: number | null;
    target: number;
    unit: "percent" | "users";
  }>;
  recommendation: "go" | "hold" | "needs_data";
  flags: FeatureFlagContract[];
}

export interface ProductBaselineResponse {
  generatedAt: string;
  windowDays: number;
  newUsers: number;
  activeUsers: number;
  metrics: {
    onboardingCompletionPercent: number;
    firstLessonCompletionPercent: number;
    todayPlanSelectionPercent: number;
    lessonCompletionPercent: number;
    medianMinutesToFirstLesson: number | null;
    meaningfulSessionsPerActiveUser: number;
  };
  eventCounts: Record<string, number>;
  notes: string[];
}

export interface ListeningChallenge {
  id: string;
  language: CourseLanguage;
  level: string;
  attempted?: boolean;
  correct?: boolean;
  title: string;
  instruction: string;
  audio: { text: string; locale: "en-GB" | "th-TH"; rate: number };
  options: Array<{ id: string; text: string }>;
}

export interface ListeningAttemptResponse {
  challengeId: string;
  correct: boolean;
  transcript: string;
  explanation: string;
  nextChallengeId: string | null;
}

export * from "./schemas";
export { ANSWER_POLICY_VERSION, normalizeAnswer } from "./answer-policy";
export type { AnswerNormalizationPolicy } from "./answer-policy";
export {
  pilotLessonIds,
  pilotLesson,
  pilotPreview,
  pilotProbe,
} from "./pilot-lessons";
