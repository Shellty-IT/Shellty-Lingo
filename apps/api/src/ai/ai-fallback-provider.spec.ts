import { describe, expect, it, vi } from "vitest";

import type { AiProvider, AiTurnRequest, AiTurnResult } from "./ai-provider";
import { DeterministicLearningProvider } from "./ai-provider";
import {
  CompositeAiProvider,
  createConversationProvider,
} from "./ai-fallback-provider";

const request: AiTurnRequest = {
  language: "en",
  level: "A1",
  scenarioId: "cafe",
  role: "barista",
  correctionMode: "no_corrections",
  learnerText: "hello",
  recentMessages: [],
};

const validResult: AiTurnResult = {
  text: "Sure, what would you like?",
  inputTokens: 10,
  outputTokens: 5,
  finishReason: "stop",
};

const provider = (
  name: string,
  completeTurn: AiProvider["completeTurn"],
): AiProvider => ({ name, completeTurn });

describe("CompositeAiProvider", () => {
  it("falls through to the next provider when the first fails", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("429 rate limited"));
    const healthy = vi.fn().mockResolvedValue(validResult);
    const composite = new CompositeAiProvider([
      provider("groq", failing),
      provider("gemini", healthy),
    ]);

    const outcome = await composite.completeTurnDetailed(request);

    expect(outcome.servedBy).toBe("gemini");
    expect(outcome.result.text).toBe(validResult.text);
    expect(failing).toHaveBeenCalledOnce();
  });

  it("serves the deterministic fallback when every remote provider fails", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("provider down"));
    const composite = new CompositeAiProvider([
      provider("groq", failing),
      new DeterministicLearningProvider(),
    ]);

    const outcome = await composite.completeTurnDetailed(request);

    expect(outcome.servedBy).toBe("deterministic-learning-fallback");
    expect(outcome.result.text.length).toBeGreaterThan(0);
  });

  it("opens the circuit breaker and stops calling a repeatedly failing provider", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("provider down"));
    const composite = new CompositeAiProvider([
      provider("groq", failing),
      new DeterministicLearningProvider(),
    ]);

    for (let attempt = 0; attempt < 3; attempt += 1)
      await composite.completeTurnDetailed(request);
    expect(failing).toHaveBeenCalledTimes(3);

    // The breaker is now open, so the failing provider is skipped entirely.
    const outcome = await composite.completeTurnDetailed(request);
    expect(failing).toHaveBeenCalledTimes(3);
    expect(outcome.servedBy).toBe("deterministic-learning-fallback");
  });
});

describe("createConversationProvider", () => {
  it("uses only the deterministic fallback when no provider key is configured", async () => {
    const provider = createConversationProvider({
      AI_PROVIDER_ORDER: [],
      GEMINI_API_KEY: undefined,
      GROQ_API_KEY: undefined,
      GEMINI_MODEL: "gemini-2.0-flash",
      GROQ_MODEL: "llama-3.3-70b-versatile",
      AI_REQUEST_TIMEOUT_MS: 20000,
      AI_MAX_RETRIES: 0,
    } as never);

    const outcome = await provider.completeTurnDetailed(request);
    expect(outcome.servedBy).toBe("deterministic-learning-fallback");
  });
});
