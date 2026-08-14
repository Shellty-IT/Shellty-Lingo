import { randomInt } from "node:crypto";

import { ConflictException, Injectable } from "@nestjs/common";
import type {
  PlacementResult,
  PlacementSessionResponse,
} from "@shellty/api-contracts";

import { PrismaService } from "../core/prisma.service";
import {
  gradePlacement,
  placementQuestionsFor,
  questionsFor,
} from "./learning-engine";
import {
  LearningContext,
  idempotencyConflict,
  invalid,
  isRecord,
  notFound,
  parseIdempotencyKey,
  parseLanguage,
  parseLocale,
} from "./learning-support";

@Injectable()
export class PlacementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
  ) {}

  async startPlacement(
    userId: string,
    input: {
      language?: string;
      interfaceLocale?: string;
      idempotencyKey?: string;
    },
  ): Promise<PlacementSessionResponse> {
    const language = parseLanguage(input.language);
    const interfaceLocale = parseLocale(input.interfaceLocale ?? "pl");
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
    const userCourse = await this.context.userCourse(userId, language);
    const previous = await this.prisma.learningSession.findUnique({
      where: {
        userCourseId_idempotencyKey: {
          userCourseId: userCourse.id,
          idempotencyKey,
        },
      },
    });
    if (previous) {
      const snapshot = isRecord(previous.result) ? previous.result : {};
      if (previous.kind !== "placement" || snapshot["examKind"] === "c1")
        throw idempotencyConflict();
      const questions = this.sessionQuestions(
        language,
        interfaceLocale,
        previous.result,
      );
      return {
        sessionId: previous.id,
        language,
        questions,
        resumed: true,
      };
    }
    const placementSeed = randomInt(1, 2_147_483_647);
    const questions = placementQuestionsFor(
      language,
      interfaceLocale,
      placementSeed,
    );
    const session = await this.prisma.learningSession.create({
      data: {
        userCourseId: userCourse.id,
        kind: "placement",
        idempotencyKey,
        result: {
          examKind: "placement",
          placementSeed,
          questionIds: questions.map((question) => question.id),
        },
      },
    });
    await this.context.event(userId, userCourse.id, null, "placement_started", {
      language,
    });
    return {
      sessionId: session.id,
      language,
      questions,
      resumed: false,
    };
  }

  async submitPlacement(
    userId: string,
    sessionId: string,
    input: {
      answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
    },
  ): Promise<PlacementResult> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { userCourse: true },
    });
    const placementSnapshot = isRecord(session?.result) ? session.result : {};
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.kind !== "placement" ||
      placementSnapshot["examKind"] === "c1"
    )
      throw notFound("PLACEMENT_SESSION_NOT_FOUND", "Test not found.");
    if (session.status === "completed") return this.placementResult(session);

    const answers = (input.answers ?? []).flatMap((answer) =>
      answer.questionId && answer.selectedOptionId
        ? [
            {
              questionId: answer.questionId.slice(0, 80),
              selectedOptionId: answer.selectedOptionId.slice(0, 80),
            },
          ]
        : [],
    );
    const unique = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    if (unique.size !== answers.length)
      throw invalid("INVALID_PLACEMENT_ANSWERS", "Answers must be unique.");
    const language = parseLanguage(session.userCourse.language);
    const questions = this.sessionQuestions(language, "pl", session.result);
    const questionIds = questions.map((question) => question.id);
    const questionResults = new Map(
      questions.map((question) => [question.id, question]),
    );
    if (
      answers.length !== 0 &&
      (answers.length !== questions.length ||
        answers.some((answer) => {
          const question = questionResults.get(answer.questionId);
          return !question?.options.some(
            (option) => option.id === answer.selectedOptionId,
          );
        }))
    )
      throw invalid(
        "INVALID_PLACEMENT_ANSWERS",
        "Submit every placement answer or skip the test.",
      );
    const result = gradePlacement(language, answers, questionIds);
    const graded = answers.map((answer) => {
      const partial = gradePlacement(language, [answer], [answer.questionId]);
      return {
        sessionId,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        correct:
          partial.correct === 1 && questionResults.has(answer.questionId),
      };
    });
    const completedAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.learningSession.updateMany({
        where: { id: sessionId, status: "active" },
        data: {
          status: "completed",
          completedAt,
          lastActivityAt: completedAt,
          correctCount: result.correct,
          totalCount: result.total,
          // Keep the immutable form snapshot after completion so a retried
          // start request can still restore the exact 30-question form.
          result: { ...placementSnapshot, ...result } as never,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException({
          code: "PLACEMENT_ALREADY_COMPLETED",
          message: "The placement test was already completed.",
        });
      if (graded.length)
        await transaction.placementAnswer.createMany({ data: graded });
      await transaction.userCourse.update({
        where: { id: session.userCourseId },
        data: {
          currentLevel:
            session.userCourse.currentLevel === "C1" ? "C1" : result.level,
          placementScore: result.score,
          placementCompletedAt: completedAt,
        },
      });
    });
    await this.context.event(
      userId,
      session.userCourseId,
      null,
      "placement_completed",
      {
        language,
        score: result.score,
        level: result.level,
      },
    );
    return { sessionId, ...result };
  }

  private placementResult(session: {
    id: string;
    correctCount: number;
    totalCount: number;
    result: unknown;
  }): PlacementResult {
    const result = isRecord(session.result) ? session.result : {};
    const level = ["A1", "A2", "B1", "B2"].includes(String(result["level"]))
      ? (result["level"] as PlacementResult["level"])
      : "A1";
    return {
      sessionId: session.id,
      correct: session.correctCount,
      total: session.totalCount,
      score:
        typeof result["score"] === "number"
          ? result["score"]
          : session.totalCount
            ? Math.round((session.correctCount / session.totalCount) * 100)
            : 0,
      level,
    };
  }

  private sessionQuestions(
    language: "en" | "th",
    locale: "pl" | "en" | "th",
    result: unknown,
  ) {
    const snapshot = isRecord(result) ? result : {};
    const seed = snapshot["placementSeed"];
    const storedIds = Array.isArray(snapshot["questionIds"])
      ? snapshot["questionIds"].filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    if (typeof seed === "number" && Number.isSafeInteger(seed)) {
      const generated = placementQuestionsFor(language, locale, seed);
      if (storedIds.length === 0) return generated;
      const byId = new Map(
        generated.map((question) => [question.id, question]),
      );
      const restored = storedIds.flatMap((id) => {
        const question = byId.get(id);
        return question ? [question] : [];
      });
      if (restored.length === storedIds.length) return restored;
    }
    // Compatibility for placement sessions created before question snapshots.
    return questionsFor(language, locale).slice(0, 20);
  }
}
