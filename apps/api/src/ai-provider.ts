import { ServiceUnavailableException } from "@nestjs/common";
import type { CorrectionMode, CourseLanguage } from "@shellty/api-contracts";

export interface AiTurnRequest {
  language: CourseLanguage;
  level: string;
  scenarioId: string;
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
  if (
    !value ||
    typeof value.text !== "string" ||
    value.text.length < 1 ||
    value.text.length > 1200 ||
    !Number.isInteger(value.inputTokens) ||
    !Number.isInteger(value.outputTokens)
  )
    throw new ServiceUnavailableException(
      "AI response did not match the versioned schema.",
    );
  return value;
}

export class DeterministicLearningProvider implements AiProvider {
  readonly name = "deterministic-learning-fallback";

  completeTurn(request: AiTurnRequest): Promise<AiTurnResult> {
    const thai = request.language === "th";
    const learnerText = request.learnerText.trim();
    const text = thai
      ? `ดีมากครับ/ค่ะ ลองขยายคำตอบอีกนิด: ${learnerText} แล้วคุณต้องการอะไรต่อครับ/คะ?`
      : `Good start. Tell me one more detail about “${learnerText}”. What would you like to do next?`;
    const shouldCorrect =
      request.correctionMode === "after_each_message" ||
      (request.correctionMode === "important_only" && learnerText.length < 4);
    return Promise.resolve(
      assertAiResult({
        text,
        correction: shouldCorrect
          ? {
              original: learnerText,
              corrected: thai ? `${learnerText}ครับ/ค่ะ` : learnerText,
              explanation: thai
                ? "Dodano neutralną wskazówkę dotyczącą partykuły grzecznościowej; dobierz ją do osoby mówiącej."
                : "The sentence is understandable; keep the complete form in a formal conversation.",
            }
          : undefined,
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
