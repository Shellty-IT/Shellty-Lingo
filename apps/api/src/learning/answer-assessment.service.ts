import type {
  AnswerAssessmentMetadata,
  AnswerNormalizationPolicy,
  CourseLanguage,
  InterfaceLocale,
} from "@shellty/api-contracts";
import { normalizeAnswer } from "@shellty/api-contracts";
import type {
  CompositeTypedAnswerAssessor,
  TypedAnswerAssessmentResult,
} from "../ai/ai-answer-assessment";
import { moderateText } from "../ai/ai-provider";
import { estimatedTokenCostUsd } from "../ai/ai-cost";

export class AnswerAssessmentService {
  constructor(
    private readonly assessor?: CompositeTypedAnswerAssessor | null,
  ) {}

  async assess(input: {
    exerciseType: "typed_answer" | "gap_fill";
    answerLanguage: CourseLanguage | InterfaceLocale;
    interfaceLocale: InterfaceLocale;
    level: string;
    prompt: string;
    instructions?: string;
    acceptedAnswers: string[];
    learnerAnswer: string;
    normalizationPolicy?: AnswerNormalizationPolicy;
  }): Promise<{
    correct: boolean;
    score: number;
    verdict: "correct" | "almost" | "incorrect" | "needs_review";
    expected: string[];
    metadata: AnswerAssessmentMetadata;
    teaching?: TypedAnswerAssessmentResult;
  }> {
    const policy =
      input.normalizationPolicy ??
      (input.exerciseType === "gap_fill" ? "gap-v2" : "sentence-v2");
    const exact = input.acceptedAnswers.some(
      (answer) =>
        normalizeAnswer(answer, policy) ===
        normalizeAnswer(input.learnerAnswer, policy),
    );
    const metadata: AnswerAssessmentMetadata = {
      status: "graded",
      policyVersion: "answer-v2",
      rubricVersion:
        input.exerciseType === "gap_fill" ? "reference-v1" : "communication-v1",
      answerLanguage: input.answerLanguage,
      source: "reference",
    };
    const base = {
      correct: exact,
      score: exact ? 1 : 0,
      verdict: exact ? ("correct" as const) : ("incorrect" as const),
      expected: input.acceptedAnswers,
      metadata,
    };
    // Known references need neither a model nor its latency. A gap checks a
    // reviewed form; semantic equivalence cannot override this closed rubric.
    if (exact || input.exerciseType === "gap_fill") return base;
    const unresolved = () => ({
      ...base,
      verdict: "needs_review" as const,
      metadata: {
        ...metadata,
        status: "needs_review" as const,
        source: "unavailable" as const,
      },
    });
    if (!this.assessor) return unresolved();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const outcome = await Promise.race([
        this.assessor.assess({
          exerciseType: input.exerciseType,
          language: input.answerLanguage,
          interfaceLocale: input.interfaceLocale,
          level: input.level,
          prompt: input.prompt,
          ...(input.instructions ? { instructions: input.instructions } : {}),
          acceptedAnswers: input.acceptedAnswers,
          learnerAnswer: input.learnerAnswer,
        }),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Assessment deadline")),
            8000,
          );
        }),
      ]);
      const result = outcome.result;
      if (
        !moderateText(
          `${result.suggestedAnswer} ${result.explanation} ${result.usageTip} ${result.examples.join(" ")}`,
        ).allowed
      )
        return unresolved();
      if (
        result.verdict !== "correct" &&
        normalizeAnswer(result.suggestedAnswer, policy) ===
          normalizeAnswer(input.learnerAnswer, policy)
      )
        return unresolved();
      return {
        correct: result.verdict === "correct",
        score:
          result.verdict === "correct"
            ? 1
            : result.verdict === "almost"
              ? 0.5
              : 0,
        verdict: result.verdict,
        expected: [result.suggestedAnswer],
        teaching: result,
        metadata: {
          ...metadata,
          source: "ai",
          provider: outcome.servedBy,
          ...(outcome.model ? { model: outcome.model } : {}),
          promptVersion: "typed-assessment-v2",
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCostUsd: estimatedTokenCostUsd(
            result.inputTokens,
            result.outputTokens,
          ),
        },
      };
    } catch {
      return unresolved();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
