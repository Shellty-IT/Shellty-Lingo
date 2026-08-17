import { describe, expect, it } from "vitest";
import type {
  ConversationSessionResponse,
  ConversationSummary,
} from "@shellty/api-contracts";

import {
  conversationProgress,
  summarySectionCount,
} from "./conversation-presentation";

const session: ConversationSessionResponse = {
  id: "conversation-1",
  correctionMode: "important_only",
  status: "active",
  remainingMessages: 9,
  scenario: {
    id: "cafe",
    category: "everyday",
    title: "At a café",
    description: "Order a drink.",
    openingLine: "What would you like?",
    role: "barista",
    level: "A1",
    estimatedMinutes: 5,
  },
  messages: [],
};

describe("conversation progress", () => {
  it("requires a learner turn before enabling the summary", () => {
    expect(conversationProgress(session)).toEqual({
      learnerTurns: 0,
      canFinish: false,
      limitReached: false,
    });

    expect(
      conversationProgress({
        ...session,
        messages: [
          {
            id: "message-1",
            role: "learner",
            text: "A coffee, please.",
            createdAt: "2026-08-17T10:00:00.000Z",
          },
        ],
      }).canFinish,
    ).toBe(true);
  });

  it("recognises both quota and server blocks as a reached limit", () => {
    expect(
      conversationProgress({ ...session, remainingMessages: 0 }).limitReached,
    ).toBe(true);
    expect(
      conversationProgress({ ...session, status: "blocked" }).limitReached,
    ).toBe(true);
  });
});

it("counts only populated learning sections in a summary", () => {
  const summary: ConversationSummary = {
    conversationId: "conversation-1",
    headline: "Good work",
    strengths: ["Clear intent"],
    corrections: [],
    newWords: [{ term: "receipt", translation: "paragon" }],
    recommendation: "Try a hotel scenario next.",
  };

  expect(summarySectionCount(summary)).toBe(2);
});
