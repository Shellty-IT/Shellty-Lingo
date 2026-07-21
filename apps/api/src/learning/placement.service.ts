import { ConflictException, Injectable } from "@nestjs/common";
import type {
  PlacementResult,
  PlacementSessionResponse,
} from "@shellty/api-contracts";

import { PrismaService } from "../core/prisma.service";
import { gradePlacement, questionsFor } from "./learning-engine";
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
      if (previous.kind !== "placement") throw idempotencyConflict();
      return {
        sessionId: previous.id,
        language,
        questions: questionsFor(language, interfaceLocale),
        resumed: true,
      };
    }
    const session = await this.prisma.learningSession.create({
      data: { userCourseId: userCourse.id, kind: "placement", idempotencyKey },
    });
    await this.context.event(userId, userCourse.id, null, "placement_started", {
      language,
    });
    return {
      sessionId: session.id,
      language,
      questions: questionsFor(language, interfaceLocale),
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
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.kind !== "placement"
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
    const questions = questionsFor(language);
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
    const result = gradePlacement(language, answers);
    const graded = answers.map((answer) => {
      const partial = gradePlacement(language, [answer]);
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
          result: result as never,
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
          currentLevel: result.level,
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
    const level = ["A1", "A2", "B1"].includes(String(result["level"]))
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
}
