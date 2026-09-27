import { Inject, Injectable, Optional } from "@nestjs/common";
import type { ExerciseCorrectionResult } from "@shellty/api-contracts";
import {
  TYPED_ANSWER_AI_PROVIDER,
  type CompositeTypedAnswerAssessor,
} from "../ai/ai-answer-assessment";
import { moderateText } from "../ai/ai-provider";
import { PrismaService } from "../core/prisma.service";
import { AnswerAssessmentService } from "./answer-assessment.service";
import {
  idempotencyConflict,
  invalid,
  isRecord,
  notFound,
  parseIdempotencyKey,
  parseLanguage,
  parseLocale,
  requestHash,
} from "./learning-support";

@Injectable()
export class PracticeService {
  async saved(userId: string, originalAttemptId: string) {
    const original = await this.prisma.exerciseAttempt.findUnique({
      where: { id: originalAttemptId },
      include: { session: { include: { userCourse: true } } },
    });
    if (!original || original.session.userCourse.userId !== userId)
      throw notFound("ATTEMPT_NOT_FOUND", "Attempt not found.");
    const saved = await this.prisma.exerciseCorrection.findUnique({
      where: { originalAttemptId },
    });
    return saved
      ? {
          ...(saved.result as unknown as Omit<
            ExerciseCorrectionResult,
            "id" | "alreadyRecorded"
          >),
          id: saved.id,
          alreadyRecorded: true,
        }
      : null;
  }
  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(TYPED_ANSWER_AI_PROVIDER)
    private readonly assessor?: CompositeTypedAnswerAssessor | null,
  ) {}

  async correct(
    userId: string,
    originalAttemptId: string,
    input: { answer?: string; idempotencyKey?: string },
  ): Promise<ExerciseCorrectionResult> {
    const key = parseIdempotencyKey(input.idempotencyKey);
    const answer =
      typeof input.answer === "string" ? input.answer.trim() : undefined;
    if (!answer || answer.length > 1200 || !moderateText(answer).allowed)
      throw invalid("INVALID_ANSWER", "Invalid correction answer.");
    const original = await this.prisma.exerciseAttempt.findUnique({
      where: { id: originalAttemptId },
      include: { exercise: true, session: { include: { userCourse: true } } },
    });
    if (!original || original.session.userCourse.userId !== userId)
      throw notFound("ATTEMPT_NOT_FOUND", "Attempt not found.");
    if (
      original.exercise.type !== "typed_answer" &&
      original.exercise.type !== "gap_fill"
    )
      throw invalid(
        "INVALID_CORRECTION_MODE",
        "This attempt does not support a text correction.",
      );
    if (original.correct)
      throw invalid(
        "CORRECTION_NOT_REQUIRED",
        "This first attempt is already correct.",
      );
    const hash = requestHash({ answer });
    const replay = (saved: {
      id: string;
      requestHash: string;
      idempotencyKey: string;
      result: unknown;
    }): ExerciseCorrectionResult => {
      if (saved.requestHash !== hash || saved.idempotencyKey !== key)
        throw idempotencyConflict();
      return {
        ...(saved.result as Omit<
          ExerciseCorrectionResult,
          "id" | "alreadyRecorded"
        >),
        id: saved.id,
        alreadyRecorded: true,
      };
    };
    const previous = await this.prisma.exerciseCorrection.findUnique({
      where: { originalAttemptId },
    });
    if (previous) return replay(previous);
    const reference = isRecord(original.exercise.answer)
      ? original.exercise.answer
      : {};
    const accepted = Array.isArray(reference["accepted"])
      ? reference["accepted"].filter(
          (value): value is string => typeof value === "string",
        )
      : typeof reference["correct"] === "string"
        ? [reference["correct"]]
        : [];
    const sessionResult = isRecord(original.session.result)
      ? original.session.result
      : {};
    const assessed = await new AnswerAssessmentService(this.assessor).assess({
      exerciseType: original.exercise.type,
      answerLanguage: parseLanguage(original.session.userCourse.language),
      interfaceLocale: parseLocale(
        typeof sessionResult["interfaceLocale"] === "string"
          ? sessionResult["interfaceLocale"]
          : "en",
      ),
      level: original.exercise.level,
      prompt: original.exercise.prompt,
      ...(original.exercise.instructions
        ? { instructions: original.exercise.instructions }
        : {}),
      acceptedAnswers: accepted,
      learnerAnswer: answer,
    });
    const result = {
      originalAttemptId,
      attemptOrdinal: 2 as const,
      correct: assessed.correct,
      score: assessed.score,
      assessment: assessed.metadata,
      assisted: true as const,
    };
    try {
      const saved = await this.prisma.exerciseCorrection.create({
        data: {
          originalAttemptId,
          idempotencyKey: key,
          requestHash: hash,
          answer,
          result: result as never,
        },
      });
      return { ...result, id: saved.id, alreadyRecorded: false };
    } catch (error) {
      const winner = await this.prisma.exerciseCorrection.findUnique({
        where: { originalAttemptId },
      });
      if (winner) return replay(winner);
      throw error;
    }
  }
}
