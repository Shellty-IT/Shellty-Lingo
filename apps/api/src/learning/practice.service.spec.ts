import { describe, expect, it, vi } from "vitest";
import { PracticeService } from "./practice.service";
import { requestHash } from "./learning-support";
const fixture = (
  owner = "user",
  result: Record<string, string> = { interfaceLocale: "pl" },
) => {
  const prisma = {
    exerciseAttempt: {
      findUnique: vi.fn().mockResolvedValue({
        id: "original",
        exercise: {
          type: "gap_fill",
          prompt: "We ___ at four.",
          level: "A2",
          answer: { accepted: ["meet"] },
        },
        session: {
          userCourse: { userId: owner, language: "en" },
          result,
        },
      }),
    },
    exerciseCorrection: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "correction" }),
    },
  };
  return { prisma, service: new PracticeService(prisma as never) };
};
describe("append-only correction practice", () => {
  it("supports older sessions without a stored interface locale", async () => {
    const f = fixture("user", {});
    await expect(
      f.service.correct("user", "original", {
        answer: "meet",
        idempotencyKey: "correct:legacy",
      }),
    ).resolves.toMatchObject({ correct: true, alreadyRecorded: false });
  });
  it("records ordinal two with assistance and leaves counters and original untouched", async () => {
    const f = fixture();
    const result = await f.service.correct("user", "original", {
      answer: "meet",
      idempotencyKey: "correct:1",
    });
    expect(result).toMatchObject({
      originalAttemptId: "original",
      attemptOrdinal: 2,
      assisted: true,
      correct: true,
      alreadyRecorded: false,
    });
    expect(f.prisma.exerciseCorrection.create).toHaveBeenCalledOnce();
    expect(Object.keys(f.prisma.exerciseAttempt)).toEqual(["findUnique"]);
  });
  it("checks ownership before returning a correction", async () => {
    const f = fixture("other");
    await expect(
      f.service.correct("user", "original", {
        answer: "meet",
        idempotencyKey: "correct:1",
      }),
    ).rejects.toMatchObject({ response: { code: "ATTEMPT_NOT_FOUND" } });
    expect(f.prisma.exerciseCorrection.findUnique).not.toHaveBeenCalled();
  });
  it("replays the same payload and rejects a changed payload", async () => {
    const f = fixture();
    f.prisma.exerciseCorrection.findUnique.mockResolvedValue({
      id: "saved",
      idempotencyKey: "correct:1",
      requestHash: requestHash({ answer: "meet" }),
      result: {
        originalAttemptId: "original",
        correct: true,
        score: 1,
        attemptOrdinal: 2,
        assisted: true,
      },
    });
    expect(
      await f.service.correct("user", "original", {
        answer: "meet",
        idempotencyKey: "correct:1",
      }),
    ).toMatchObject({ id: "saved", alreadyRecorded: true });
    await expect(
      f.service.correct("user", "original", {
        answer: "meets",
        idempotencyKey: "correct:1",
      }),
    ).rejects.toMatchObject({ response: { code: "IDEMPOTENCY_KEY_REUSED" } });
    expect(f.prisma.exerciseCorrection.create).not.toHaveBeenCalled();
  });
  it("resolves a concurrent insert using its immutable winner", async () => {
    const f = fixture();
    f.prisma.exerciseCorrection.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "winner",
        idempotencyKey: "correct:1",
        requestHash: requestHash({ answer: "meet" }),
        result: { correct: true },
      });
    f.prisma.exerciseCorrection.create.mockRejectedValue(
      new Error("unique constraint"),
    );
    expect(
      await f.service.correct("user", "original", {
        answer: "meet",
        idempotencyKey: "correct:1",
      }),
    ).toMatchObject({ id: "winner", alreadyRecorded: true });
  });
});
