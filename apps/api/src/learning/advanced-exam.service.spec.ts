import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { c1ExamQuestionsFor } from "./advanced-assessment-bank";
import { AdvancedExamService } from "./advanced-exam.service";

describe("C1 advanced exam", () => {
  it("builds a deterministic, balanced 32-question form", () => {
    const first = c1ExamQuestionsFor("pl", 20260814);
    const resumed = c1ExamQuestionsFor("pl", 20260814);
    const next = c1ExamQuestionsFor("pl", 20260815);

    expect(first).toEqual(resumed);
    expect(first).not.toEqual(next);
    expect(first).toHaveLength(32);
    for (const skill of [
      "grammar",
      "vocabulary",
      "reading",
      "listening",
    ] as const)
      expect(first.filter((question) => question.skill === skill)).toHaveLength(
        8,
      );
    expect(
      first.every((question) =>
        question.options.some((option) => option.id === question.correct),
      ),
    ).toBe(true);
  });

  it("only starts the exam for an English B2 learner and hides answer keys", async () => {
    const create = vi.fn().mockResolvedValue({ id: "exam-1" });
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue(null),
        create,
      },
    };
    const context = {
      userCourse: vi.fn().mockResolvedValue({
        id: "course-1",
        currentLevel: "B2",
      }),
      event: vi.fn(),
    };
    const service = new AdvancedExamService(prisma as never, context as never);

    const result = await service.start("user-1", {
      interfaceLocale: "pl",
      idempotencyKey: "c1-exam:attempt:1",
    });

    expect(result.targetLevel).toBe("C1");
    expect(result.questions).toHaveLength(32);
    expect(result.questions.every((question) => !("correct" in question))).toBe(
      true,
    );
    expect(create).toHaveBeenCalledOnce();
  });

  it("rejects the C1 exam below B2", async () => {
    const prisma = {
      learningSession: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const context = {
      userCourse: vi.fn().mockResolvedValue({
        id: "course-1",
        currentLevel: "B1",
      }),
    };
    const service = new AdvancedExamService(prisma as never, context as never);

    await expect(
      service.start("user-1", {
        interfaceLocale: "pl",
        idempotencyKey: "c1-exam:attempt:2",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("promotes a learner to C1 and returns a congratulatory notification", async () => {
    const questions = c1ExamQuestionsFor("pl", 12345);
    const snapshot = {
      examKind: "c1",
      examSeed: 12345,
      interfaceLocale: "pl",
      questionIds: questions.map((question) => question.id),
    };
    const transaction = {
      learningSession: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      placementAnswer: { createMany: vi.fn().mockResolvedValue({ count: 32 }) },
      userCourse: { update: vi.fn().mockResolvedValue({}) },
    };
    const prisma = {
      learningSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "exam-1",
          userCourseId: "course-1",
          kind: "placement",
          status: "active",
          result: snapshot,
          userCourse: {
            userId: "user-1",
            language: "en",
            currentLevel: "B2",
          },
        }),
      },
      $transaction: vi.fn(
        (callback: (client: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };
    const context = { event: vi.fn() };
    const service = new AdvancedExamService(prisma as never, context as never);

    const result = await service.submit("user-1", "exam-1", {
      answers: questions.map((question) => ({
        questionId: question.id,
        selectedOptionId: question.correct,
      })),
    });

    expect(result).toMatchObject({ passed: true, level: "C1", score: 100 });
    expect(result.notification.title).toContain("Gratulacje");
    expect(transaction.userCourse.update).toHaveBeenCalledWith({
      where: { id: "course-1" },
      data: { currentLevel: "C1" },
    });
  });
});
