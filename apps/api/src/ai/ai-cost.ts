/** Conservative blended estimate used for budget enforcement and reporting. */
export const AI_COST_PER_TOKEN_USD = 0.000002;

export const estimatedTokenCostUsd = (
  inputTokens: number,
  outputTokens: number,
): number => (inputTokens + outputTokens) * AI_COST_PER_TOKEN_USD;

export type DailyAiUsageMessage = {
  role: "learner" | "assistant";
  turnKey: string | null;
  inputTokens: number;
  outputTokens: number;
  speechCostUsd: unknown;
  moderation: unknown;
};

/** Count remote-model turns and speech; deterministic fallbacks cost nothing. */
export function estimatedConversationSpend(
  messages: DailyAiUsageMessage[],
): number {
  const remoteTurns = new Map<string, boolean>();
  for (const message of messages) {
    if (message.role !== "assistant" || !message.turnKey) continue;
    const servedBy =
      typeof message.moderation === "object" && message.moderation !== null
        ? (message.moderation as Record<string, unknown>)["servedBy"]
        : undefined;
    remoteTurns.set(
      message.turnKey,
      typeof servedBy !== "string" || !servedBy.startsWith("deterministic"),
    );
  }
  const tokenCount = messages.reduce((sum, message) => {
    if (!message.turnKey || remoteTurns.get(message.turnKey) !== true)
      return sum;
    return (
      sum +
      (message.role === "learner" ? message.inputTokens : message.outputTokens)
    );
  }, 0);
  const speechCost = messages.reduce(
    (sum, message) => sum + Number(message.speechCostUsd ?? 0),
    0,
  );
  return tokenCount * AI_COST_PER_TOKEN_USD + speechCost;
}
