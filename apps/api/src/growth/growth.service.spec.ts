import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { GrowthService } from "./growth.service";

describe("GrowthService conversation idempotency", () => {
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
});
