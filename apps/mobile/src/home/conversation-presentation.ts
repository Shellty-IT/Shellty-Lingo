import type {
  ConversationSessionResponse,
  ConversationSummary,
} from "@shellty/api-contracts";

export function conversationProgress(
  conversation: ConversationSessionResponse,
): {
  learnerTurns: number;
  canFinish: boolean;
  limitReached: boolean;
} {
  const learnerTurns = conversation.messages.filter(
    (message) => message.role === "learner",
  ).length;

  return {
    learnerTurns,
    canFinish: learnerTurns > 0 && conversation.status === "active",
    limitReached:
      conversation.remainingMessages <= 0 || conversation.status === "blocked",
  };
}

export function summarySectionCount(summary: ConversationSummary): number {
  return [summary.strengths, summary.corrections, summary.newWords].filter(
    (items) => items.length > 0,
  ).length;
}
