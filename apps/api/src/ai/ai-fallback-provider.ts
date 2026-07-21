import { ServiceUnavailableException } from "@nestjs/common";
import type { ApiEnvironment } from "@shellty/config";

import {
  AiCircuitBreaker,
  DeterministicLearningProvider,
  type AiProvider,
  type AiTurnRequest,
  type AiTurnResult,
} from "./ai-provider";
import { GeminiProvider } from "./ai-gemini-provider";
import { GroqProvider } from "./ai-groq-provider";

export const CONVERSATION_AI_PROVIDER = Symbol("CONVERSATION_AI_PROVIDER");

export interface AiTurnOutcome {
  result: AiTurnResult;
  servedBy: string;
}

/**
 * Ordered chain of AI providers with per-provider circuit breakers. Each turn is
 * tried against providers in order; the first that returns a valid result wins.
 * The last link is always the deterministic fallback, so a turn never fails just
 * because every remote provider is rate-limited or down (docs/engineering-guidelines.md §7, §13).
 */
export class CompositeAiProvider implements AiProvider {
  readonly name = "composite";
  private readonly breakers: Map<string, AiCircuitBreaker>;

  constructor(private readonly providers: AiProvider[]) {
    if (providers.length === 0)
      throw new Error("CompositeAiProvider requires at least one provider.");
    this.breakers = new Map(
      providers.map((provider) => [provider.name, new AiCircuitBreaker()]),
    );
  }

  async completeTurn(request: AiTurnRequest): Promise<AiTurnResult> {
    return (await this.completeTurnDetailed(request)).result;
  }

  /** Like completeTurn but also reports which provider served the turn. */
  async completeTurnDetailed(request: AiTurnRequest): Promise<AiTurnOutcome> {
    let lastError: unknown;
    for (const provider of this.providers) {
      const breaker = this.breakers.get(provider.name);
      if (breaker && !breaker.canRequest()) continue;
      try {
        const result = await provider.completeTurn(request);
        breaker?.success();
        return { result, servedBy: provider.name };
      } catch (error) {
        breaker?.failure();
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new ServiceUnavailableException("No AI provider could serve the turn.");
  }
}

/**
 * Build the conversation provider chain from configuration. Providers listed in
 * AI_PROVIDER_ORDER are included only when their API key is present; the
 * deterministic fallback is always appended as the final link.
 */
export function createConversationProvider(
  env: ApiEnvironment,
): CompositeAiProvider {
  const providers: AiProvider[] = [];
  const shared = {
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES,
  };
  for (const name of env.AI_PROVIDER_ORDER) {
    if (name === "gemini" && env.GEMINI_API_KEY)
      providers.push(
        new GeminiProvider({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL,
          ...shared,
        }),
      );
    if (name === "groq" && env.GROQ_API_KEY)
      providers.push(
        new GroqProvider({
          apiKey: env.GROQ_API_KEY,
          model: env.GROQ_MODEL,
          ...shared,
        }),
      );
  }
  providers.push(new DeterministicLearningProvider());
  return new CompositeAiProvider(providers);
}
