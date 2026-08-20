import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { GrowthService } from "./growth.service";

describe("GrowthService conversation idempotency", () => {
  it("uses today's course events to reduce the remaining daily plan", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { name: "lesson_completed", properties: {} },
      { name: "review_completed", properties: {} },
    ]);
    const prisma = {
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({
          id: "course-1",
          userId: "user-1",
          language: "en",
          dailyMinutes: 15,
          timezone: "UTC",
        }),
      },
      reviewItem: { count: vi.fn().mockResolvedValue(0) },
      lessonProgress: { findMany: vi.fn().mockResolvedValue([]) },
      learningEvent: { findMany },
      translation: { findUnique: vi.fn() },
    };
    const service = new GrowthService(
      prisma as never,
      {} as never,
      { isAvailable: vi.fn().mockResolvedValue(false) } as never,
      { get: vi.fn().mockResolvedValue([]) } as never,
      {} as never,
      { AI_DAILY_BUDGET_USD: 8 } as never,
    );

    const plan = await service.today("user-1", "en", "pl");

    expect(plan.completedItems).toBe(2);
    expect(plan.completedMinutes).toBe(7);
    expect(plan.totalMinutes).toBe(8);
    const eventQuery = findMany.mock.calls[0]?.[0] as
      | {
          where: {
            userCourseId: string;
            createdAt: { gte: Date; lt: Date };
          };
        }
      | undefined;
    expect(eventQuery?.where.userCourseId).toBe("course-1");
    expect(eventQuery?.where.createdAt.gte).toBeInstanceOf(Date);
    expect(eventQuery?.where.createdAt.lt).toBeInstanceOf(Date);
  });

  it("provides a scenario-specific opening line for every role-play", async () => {
    const prisma = {
      userCourse: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: "course-en",
            userId: "user-1",
            language: "en",
            currentLevel: "B2",
          })
          .mockResolvedValueOnce({
            id: "course-th",
            userId: "user-1",
            language: "th",
            currentLevel: "B2",
          }),
      },
    };
    const service = new GrowthService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { AI_DAILY_BUDGET_USD: 8 } as never,
    );

    for (const language of ["en", "th"] as const) {
      const scenarios = await service.listScenarios("user-1", language);
      expect(scenarios.length).toBeGreaterThan(0);
      expect(scenarios.every((scenario) => scenario.openingLine.trim())).toBe(
        true,
      );
      expect(
        new Set(scenarios.map((scenario) => scenario.openingLine)).size,
      ).toBe(scenarios.length);
    }
  });

  it("does not expose conversation scenarios above the learner level", async () => {
    const prisma = {
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({
          id: "course-en",
          userId: "user-1",
          language: "en",
          currentLevel: "A2",
        }),
      },
    };
    const service = new GrowthService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { AI_DAILY_BUDGET_USD: 8 } as never,
    );

    const available = await service.listScenarios("user-1", "en");

    expect(available.some((scenario) => scenario.level === "B2")).toBe(false);
    expect(available.some((scenario) => scenario.level === "A2")).toBe(true);
  });

  it("resumes a conversation start with the same request key", async () => {
    const requestKey = "conversation-start:1";
    const requestHash = createHash("sha256")
      .update("en:cafe:important_only")
      .digest("hex");
    const previous = {
      id: "conversation-1",
      userCourseId: "course-1",
      scenarioId: "cafe",
      correctionMode: "important_only",
      level: "A1",
      status: "active" as const,
      messageLimit: 12,
      requestHash,
      messages: [],
    };
    const prisma = {
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({
          id: "course-1",
          userId: "user-1",
          language: "en",
        }),
      },
      aiConversation: { findUnique: vi.fn().mockResolvedValue(previous) },
      aiPromptVersion: { upsert: vi.fn() },
    };
    const service = new GrowthService(
      prisma as never,
      {} as never,
      { requireAvailable: vi.fn().mockResolvedValue(undefined) } as never,
      {} as never,
      {} as never,
      { AI_DAILY_BUDGET_USD: 8 } as never,
    );

    const result = await service.startConversation("user-1", {
      language: "en",
      scenarioId: "cafe",
      correctionMode: "important_only",
      idempotencyKey: requestKey,
    });

    expect(result.id).toBe(previous.id);
    expect(prisma.aiPromptVersion.upsert).not.toHaveBeenCalled();
  });

  it("returns a stored turn before charging the plan again", async () => {
    const text = "A coffee, please.";
    const turnKey = "conversation:1:turn:1";
    const prisma = {
      aiConversation: {
        findFirst: vi.fn().mockResolvedValue({
          id: "conversation-1",
          userCourseId: "course-1",
          scenarioId: "cafe",
          correctionMode: "important_only",
          level: "A1",
          status: "active",
          messageLimit: 12,
          userCourse: { userId: "user-1", language: "en" },
          messages: [
            {
              role: "learner",
              turnKey,
              requestHash: createHash("sha256").update(text).digest("hex"),
              text,
              correction: null,
              createdAt: new Date(),
            },
            {
              role: "assistant",
              turnKey,
              requestHash: null,
              text: "Certainly. Anything else?",
              correction: null,
              createdAt: new Date(),
            },
          ],
        }),
      },
    };
    const billing = { assertAiMessageAllowed: vi.fn() };
    const release = { requireAvailable: vi.fn().mockResolvedValue(undefined) };
    const service = new GrowthService(
      prisma as never,
      billing as never,
      release as never,
      {} as never,
      {} as never,
      { AI_DAILY_BUDGET_USD: 8 } as never,
    );

    const result = await service.sendMessage("user-1", "conversation-1", {
      text,
      idempotencyKey: turnKey,
    });

    expect(result.message.text).toBe("Certainly. Anything else?");
    expect(result.remainingMessages).toBe(11);
    expect(billing.assertAiMessageAllowed).not.toHaveBeenCalled();
  });

  it("does not transcribe a retried voice turn twice", async () => {
    const text = "I cannot log in.";
    const turnKey = "conversation:1:voice:1";
    const messages = [
      {
        role: "learner",
        turnKey,
        requestHash: createHash("sha256").update(text).digest("hex"),
        text,
        correction: null,
        createdAt: new Date(),
      },
      {
        role: "assistant",
        turnKey,
        requestHash: null,
        text: "What error message do you see?",
        correction: null,
        createdAt: new Date(),
      },
    ];
    const prisma = {
      aiConversation: {
        findFirst: vi.fn().mockResolvedValue({
          id: "conversation-1",
          userCourseId: "course-1",
          scenarioId: "it-support-a1",
          correctionMode: "important_only",
          level: "A1",
          status: "active",
          messageLimit: 12,
          userCourse: { userId: "user-1", language: "en" },
          messages,
        }),
      },
    };
    const transcribe = vi.fn();
    const service = new GrowthService(
      prisma as never,
      { assertAiMessageAllowed: vi.fn() } as never,
      { requireAvailable: vi.fn().mockResolvedValue(undefined) } as never,
      {} as never,
      {} as never,
      { AI_DAILY_BUDGET_USD: 8 } as never,
      { transcribe } as never,
    );

    const result = await service.sendVoiceMessage("user-1", "conversation-1", {
      audioBase64: "YWJj",
      mimeType: "audio/m4a",
      idempotencyKey: turnKey,
    });

    expect(result.transcript).toBe(text);
    expect(result.turn.message.text).toBe("What error message do you see?");
    expect(transcribe).not.toHaveBeenCalled();
  });
});
