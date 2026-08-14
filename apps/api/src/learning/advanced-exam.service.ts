import { randomInt } from "node:crypto";

import { ConflictException, Injectable } from "@nestjs/common";
import type {
  AdvancedExamResult,
  AdvancedExamSessionResponse,
  InterfaceLocale,
} from "@shellty/api-contracts";

import { PrismaService } from "../core/prisma.service";
import {
  c1ExamQuestionsFor,
  type AssessmentQuestion,
} from "./advanced-assessment-bank";
import {
  LearningContext,
  idempotencyConflict,
  invalid,
  isRecord,
  notFound,
  parseIdempotencyKey,
  parseLocale,
} from "./learning-support";

const C1_PASS_SCORE = 80;

@Injectable()
export class AdvancedExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly context: LearningContext,
  ) {}

  async start(
    userId: string,
    input: { interfaceLocale?: string; idempotencyKey?: string },
  ): Promise<AdvancedExamSessionResponse> {
    const interfaceLocale = parseLocale(input.interfaceLocale ?? "pl");
    const idempotencyKey = parseIdempotencyKey(input.idempotencyKey);
    const userCourse = await this.context.userCourse(userId, "en");
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
      if (previous.kind !== "placement" || snapshot["examKind"] !== "c1")
        throw idempotencyConflict();
      return this.sessionResponse(previous.id, snapshot, interfaceLocale, true);
    }
    if (userCourse.currentLevel !== "B2")
      throw invalid(
        "C1_EXAM_NOT_AVAILABLE",
        "The C1 exam is available after reaching B2.",
      );

    const examSeed = randomInt(1, 2_147_483_647);
    const questions = c1ExamQuestionsFor(interfaceLocale, examSeed);
    const session = await this.prisma.learningSession.create({
      data: {
        userCourseId: userCourse.id,
        kind: "placement",
        idempotencyKey,
        result: {
          examKind: "c1",
          examSeed,
          interfaceLocale,
          questionIds: questions.map((question) => question.id),
        },
      },
    });
    await this.context.event(userId, userCourse.id, null, "c1_exam_started", {
      sessionId: session.id,
      questionCount: questions.length,
    });
    return {
      sessionId: session.id,
      language: "en",
      targetLevel: "C1",
      questions: questions.map((question) => this.withoutAnswer(question)),
      resumed: false,
    };
  }

  async submit(
    userId: string,
    sessionId: string,
    input: {
      answers?: Array<{ questionId?: string; selectedOptionId?: string }>;
    },
  ): Promise<AdvancedExamResult> {
    const session = await this.prisma.learningSession.findUnique({
      where: { id: sessionId },
      include: { userCourse: true },
    });
    const snapshot = isRecord(session?.result) ? session.result : {};
    if (
      !session ||
      session.userCourse.userId !== userId ||
      session.userCourse.language !== "en" ||
      session.kind !== "placement" ||
      snapshot["examKind"] !== "c1"
    )
      throw notFound("C1_EXAM_NOT_FOUND", "C1 exam session not found.");
    if (session.status === "completed") return this.completedResult(session);

    const questions = this.restoreQuestions(snapshot);
    const answers = (input.answers ?? []).map((answer) => ({
      questionId: answer.questionId?.trim() ?? "",
      selectedOptionId: answer.selectedOptionId?.trim() ?? "",
    }));
    const unique = new Map(
      answers.map((answer) => [answer.questionId, answer]),
    );
    const byId = new Map(questions.map((question) => [question.id, question]));
    if (
      answers.length !== questions.length ||
      unique.size !== questions.length ||
      answers.some(
        (answer) =>
          !byId
            .get(answer.questionId)
            ?.options.some((option) => option.id === answer.selectedOptionId),
      )
    )
      throw invalid(
        "INVALID_C1_EXAM_ANSWERS",
        "Submit one valid answer for every C1 exam question.",
      );

    const correct = answers.filter(
      (answer) =>
        byId.get(answer.questionId)?.correct === answer.selectedOptionId,
    ).length;
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= C1_PASS_SCORE;
    const completedAt = new Date();
    const result = {
      ...snapshot,
      score,
      correct,
      total: questions.length,
      passed,
      level: passed ? "C1" : "B2",
    };

    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.learningSession.updateMany({
        where: { id: sessionId, status: "active" },
        data: {
          status: "completed",
          completedAt,
          lastActivityAt: completedAt,
          correctCount: correct,
          totalCount: questions.length,
          result: result as never,
        },
      });
      if (claimed.count !== 1)
        throw new ConflictException({
          code: "C1_EXAM_ALREADY_COMPLETED",
          message: "The C1 exam has already been completed.",
        });
      await transaction.placementAnswer.createMany({
        data: answers.map((answer) => ({
          sessionId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          correct:
            byId.get(answer.questionId)?.correct === answer.selectedOptionId,
        })),
      });
      if (passed)
        await transaction.userCourse.update({
          where: { id: session.userCourseId },
          data: { currentLevel: "C1" },
        });
    });
    await this.context.event(
      userId,
      session.userCourseId,
      null,
      "c1_exam_completed",
      {
        sessionId,
        score,
        passed,
      },
    );
    return this.resultResponse(sessionId, result);
  }

  private sessionResponse(
    sessionId: string,
    snapshot: Record<string, unknown>,
    requestedLocale: InterfaceLocale,
    resumed: boolean,
  ): AdvancedExamSessionResponse {
    const locale =
      snapshot["interfaceLocale"] === "pl" ||
      snapshot["interfaceLocale"] === "en" ||
      snapshot["interfaceLocale"] === "th"
        ? snapshot["interfaceLocale"]
        : requestedLocale;
    const questions = this.restoreQuestions(snapshot, locale);
    return {
      sessionId,
      language: "en",
      targetLevel: "C1",
      questions: questions.map((question) => this.withoutAnswer(question)),
      resumed,
    };
  }

  private restoreQuestions(
    snapshot: Record<string, unknown>,
    localeOverride?: InterfaceLocale,
  ): AssessmentQuestion[] {
    const seed = snapshot["examSeed"];
    if (typeof seed !== "number" || !Number.isSafeInteger(seed))
      throw invalid("INVALID_C1_EXAM", "C1 exam snapshot is invalid.");
    const locale =
      localeOverride ??
      (snapshot["interfaceLocale"] === "en" ||
      snapshot["interfaceLocale"] === "th" ||
      snapshot["interfaceLocale"] === "pl"
        ? snapshot["interfaceLocale"]
        : "pl");
    const generated = c1ExamQuestionsFor(locale, seed);
    const ids = Array.isArray(snapshot["questionIds"])
      ? snapshot["questionIds"].filter(
          (value): value is string => typeof value === "string",
        )
      : [];
    if (ids.length === 0) return generated;
    const byId = new Map(generated.map((question) => [question.id, question]));
    const restored = ids.flatMap((id) => {
      const question = byId.get(id);
      return question ? [question] : [];
    });
    if (restored.length !== ids.length)
      throw invalid("INVALID_C1_EXAM", "C1 exam question set is invalid.");
    return restored;
  }

  private completedResult(session: {
    id: string;
    result: unknown;
    correctCount: number;
    totalCount: number;
    userCourse: { currentLevel: string };
  }): AdvancedExamResult {
    const result = isRecord(session.result) ? session.result : {};
    return this.resultResponse(session.id, {
      ...result,
      correct: session.correctCount,
      total: session.totalCount,
      score:
        typeof result["score"] === "number"
          ? result["score"]
          : session.totalCount
            ? Math.round((session.correctCount / session.totalCount) * 100)
            : 0,
      passed: result["passed"] === true,
      level: session.userCourse.currentLevel === "C1" ? "C1" : "B2",
    });
  }

  private resultResponse(
    sessionId: string,
    result: Record<string, unknown>,
  ): AdvancedExamResult {
    const passed = result["passed"] === true;
    const locale =
      result["interfaceLocale"] === "en" ||
      result["interfaceLocale"] === "th" ||
      result["interfaceLocale"] === "pl"
        ? result["interfaceLocale"]
        : "pl";
    const notification = this.notification(locale, passed);
    return {
      sessionId,
      score: typeof result["score"] === "number" ? result["score"] : 0,
      correct: typeof result["correct"] === "number" ? result["correct"] : 0,
      total: typeof result["total"] === "number" ? result["total"] : 0,
      passed,
      level: passed ? "C1" : "B2",
      notification,
    };
  }

  private notification(
    locale: InterfaceLocale,
    passed: boolean,
  ): AdvancedExamResult["notification"] {
    if (locale === "en")
      return passed
        ? {
            title: "Congratulations! You reached C1!",
            message:
              "You passed the advanced exam. Your English level is now C1.",
          }
        : {
            title: "Keep going — you are close",
            message:
              "Your level remains B2. Review the difficult areas and try again.",
          };
    if (locale === "th")
      return passed
        ? {
            title: "ยินดีด้วย! คุณผ่านระดับ C1 แล้ว",
            message: "คุณผ่านแบบทดสอบขั้นสูง ระดับภาษาอังกฤษของคุณคือ C1",
          }
        : {
            title: "พยายามต่อไป คุณใกล้แล้ว",
            message: "ระดับของคุณยังเป็น B2 ทบทวนแล้วลองอีกครั้ง",
          };
    return passed
      ? {
          title: "Gratulacje! Osiągasz poziom C1!",
          message:
            "Rozszerzony egzamin został zaliczony. Twój poziom języka angielskiego to teraz C1.",
        }
      : {
          title: "Niewiele zabrakło — próbuj dalej",
          message:
            "Twój poziom pozostaje na B2. Powtórz trudniejsze zagadnienia i podejdź do egzaminu ponownie.",
        };
  }

  private withoutAnswer(
    question: AssessmentQuestion,
  ): Omit<AssessmentQuestion, "correct"> {
    return {
      id: question.id,
      skill: question.skill,
      prompt: question.prompt,
      options: question.options,
      ...(question.audioText ? { audioText: question.audioText } : {}),
    };
  }
}
