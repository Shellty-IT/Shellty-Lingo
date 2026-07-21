import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiTurnRequest } from "./ai-provider";
import { GroqProvider } from "./ai-groq-provider";

const request: AiTurnRequest = {
  language: "en",
  level: "A1",
  scenarioId: "cafe",
  role: "barista",
  correctionMode: "important_only",
  learnerText: "i want coffee",
  recentMessages: [{ role: "assistant", text: "Hello!" }],
};

const provider = new GroqProvider({
  apiKey: "test-key",
  model: "llama-3.3-70b-versatile",
  timeoutMs: 5000,
  maxRetries: 0,
});

afterEach(() => vi.restoreAllMocks());

describe("GroqProvider", () => {
  it("maps an OpenAI-compatible response into a validated turn", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  text: "Sure! What size would you like?",
                  correction: {
                    original: "i want coffee",
                    corrected: "I would like a coffee.",
                    explanation: "Use a polite request form.",
                  },
                }),
              },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 42, completion_tokens: 12 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider.completeTurn(request);

    expect(result.text).toBe("Sure! What size would you like?");
    expect(result.correction?.corrected).toBe("I would like a coffee.");
    expect(result.inputTokens).toBe(42);
    expect(result.outputTokens).toBe(12);
    expect(result.finishReason).toBe("stop");
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("groq.com");
    expect(init.body as string).toContain("llama-3.3-70b-versatile");
  });

  it("throws on a non-2xx response so the chain can move on", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })),
    );

    await expect(provider.completeTurn(request)).rejects.toThrow(/429/);
  });
});
