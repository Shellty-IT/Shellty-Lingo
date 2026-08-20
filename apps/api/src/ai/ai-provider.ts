import { ServiceUnavailableException } from "@nestjs/common";
import type { CorrectionMode, CourseLanguage } from "@shellty/api-contracts";

export interface AiTurnRequest {
  language: CourseLanguage;
  level: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioGoal: string;
  role: string;
  correctionMode: CorrectionMode;
  learnerText: string;
  recentMessages: Array<{ role: "learner" | "assistant"; text: string }>;
}

export interface AiTurnResult {
  text: string;
  correction?: { original: string; corrected: string; explanation: string };
  inputTokens: number;
  outputTokens: number;
  finishReason: "stop" | "length";
}

export interface AiProvider {
  readonly name: string;
  completeTurn(request: AiTurnRequest): Promise<AiTurnResult>;
}

const forbidden = [
  /ignore (all|the|previous) instructions/i,
  /system prompt/i,
  /reveal.{0,20}(prompt|secret|token)/i,
  /(?:kill|suicide|bomb instructions)/i,
];

export function moderateText(text: string): {
  allowed: boolean;
  reason?: string;
} {
  const match = forbidden.find((pattern) => pattern.test(text));
  return match
    ? { allowed: false, reason: "unsafe_or_prompt_injection" }
    : { allowed: true };
}

export function assertAiResult(value: AiTurnResult): AiTurnResult {
  const correction = value?.correction;
  if (
    !value ||
    typeof value.text !== "string" ||
    value.text.length < 1 ||
    value.text.length > 1200 ||
    !Number.isInteger(value.inputTokens) ||
    value.inputTokens < 0 ||
    !Number.isInteger(value.outputTokens) ||
    value.outputTokens < 0 ||
    !["stop", "length"].includes(value.finishReason) ||
    (correction !== undefined &&
      (typeof correction.original !== "string" ||
        typeof correction.corrected !== "string" ||
        typeof correction.explanation !== "string" ||
        correction.original.length > 1200 ||
        correction.corrected.length > 1200 ||
        correction.explanation.length > 2000))
  )
    throw new ServiceUnavailableException(
      "AI response did not match the versioned schema.",
    );
  if (
    correction &&
    normalizedCorrectionText(correction.original) ===
      normalizedCorrectionText(correction.corrected)
  )
    return { ...value, correction: undefined };
  return value;
}

const normalizedCorrectionText = (value: string): string =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();

const englishCorrection = (learnerText: string): AiTurnResult["correction"] => {
  let corrected = learnerText
    .replace(/\bi dont\b/gi, "I don't")
    .replace(/\bi am agree\b/gi, "I agree")
    .replace(/\bi have reservation\b/gi, "I have a reservation")
    .replace(/\bi want coffee\b/gi, "I would like a coffee")
    .replace(/\b(he|she|it) go\b/gi, "$1 goes")
    .replace(/(^|[.!?]\s+)i\b/g, "$1I")
    .trim();
  if (
    normalizedCorrectionText(corrected) ===
    normalizedCorrectionText(learnerText)
  )
    return undefined;
  if (!/[.!?]$/.test(corrected)) corrected += ".";
  return {
    original: learnerText,
    corrected,
    explanation:
      "This version fixes a grammar form while keeping your original meaning.",
  };
};

const fallbackReplies: Record<string, string[]> = {
  cafe: [
    "Certainly. What size would you like?",
    "Would you like anything to eat with that?",
    "Will you have it here or take it away?",
  ],
  hotel: [
    "Thank you. What name is the reservation under?",
    "How many nights will you be staying?",
    "Is there anything you would like to know about the hotel?",
  ],
  "business-status": [
    "What is the most important result you have completed so far?",
    "Is anything blocking the next step?",
    "What should the team agree on today?",
  ],
  "it-support-a1": [
    "What happens when you try to sign in?",
    "Do you see an error message?",
    "Have you already tried resetting your password?",
  ],
  "it-sprint-a2": [
    "What did you finish yesterday?",
    "Do you have any blockers today?",
    "What will you work on next?",
  ],
  "it-incident-b1": [
    "Which users or services are affected right now?",
    "What mitigation is already in place?",
    "What is the next decision the incident team must make?",
  ],
  "business-negotiation-b2": [
    "Which constraint has the greatest impact on the agreement?",
    "What conditional offer could address that concern?",
    "Where do you see room for compromise?",
  ],
  "it-architecture-b2": [
    "Which trade-off had the greatest influence on that decision?",
    "How does the design behave when that dependency fails?",
    "What evidence would convince you to revisit this approach?",
  ],
};

export class DeterministicLearningProvider implements AiProvider {
  readonly name = "deterministic-learning-fallback";

  completeTurn(request: AiTurnRequest): Promise<AiTurnResult> {
    const thai = request.language === "th";
    const learnerText = request.learnerText.trim();
    const turnIndex = request.recentMessages.filter(
      (message) => message.role === "learner",
    ).length;
    const replies = fallbackReplies[request.scenarioId];
    const text = thai
      ? "ขอบคุณครับ/ค่ะ ช่วยเล่ารายละเอียดที่สำคัญที่สุดเพิ่มอีกหนึ่งอย่างได้ไหมครับ/คะ"
      : (replies?.[turnIndex % replies.length] ??
        `What is the most important detail about ${request.scenarioTitle.toLocaleLowerCase()}?`);
    const correction = thai ? undefined : englishCorrection(learnerText);
    const shouldCorrect =
      request.correctionMode === "after_each_message" ||
      request.correctionMode === "important_only";
    return Promise.resolve(
      assertAiResult({
        text,
        correction: shouldCorrect ? correction : undefined,
        inputTokens: Math.ceil(
          (learnerText.length +
            request.recentMessages.reduce(
              (sum, item) => sum + item.text.length,
              0,
            )) /
            4,
        ),
        outputTokens: Math.ceil(text.length / 4),
        finishReason: "stop",
      }),
    );
  }
}

export class AiCircuitBreaker {
  private failures = 0;
  private openUntil = 0;

  constructor(
    private readonly threshold = 3,
    private readonly cooldownMs = 30_000,
  ) {}

  canRequest(now = Date.now()): boolean {
    return now >= this.openUntil;
  }

  success(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  failure(now = Date.now()): void {
    this.failures += 1;
    if (this.failures >= this.threshold) this.openUntil = now + this.cooldownMs;
  }
}
