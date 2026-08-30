import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiTurnRequest } from "./ai-provider";
import { GroqProvider } from "./ai-groq-provider";

const request: AiTurnRequest = {
  language: "en",
  level: "A1",
  scenarioId: "cafe",
  scenarioTitle: "At a café",
  scenarioGoal: "Order a drink.",
  scenarioBriefing: "Coffee costs £2.50 and takeaway is available.",
  learnerRole: "You are a customer.",
  objectives: ["Order a drink.", "Confirm takeaway."],
  role: "barista",
  correctionMode: "important_only",
  learnerText: "i want coffee",
  recentMessages: [{ role: "assistant", text: "Hello!" }],
};

const provider = new GroqProvider({
  apiKey: "test-key",
  model: "openai/gpt-oss-120b",
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
    const payload = JSON.parse(init.body as string) as {
      model: string;
      max_completion_tokens: number;
      reasoning_effort: string;
      response_format: {
        type: string;
        json_schema: { name: string; strict: boolean };
      };
      messages: Array<{ role: string; content: string }>;
    };
    expect(payload.model).toBe("openai/gpt-oss-120b");
    expect(payload.max_completion_tokens).toBe(768);
    expect(payload.reasoning_effort).toBe("low");
    expect(payload.response_format).toMatchObject({
      type: "json_schema",
      json_schema: { name: "language_tutor_turn", strict: true },
    });
    expect(payload.messages.slice(1).map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    expect(payload.messages[2]?.content).toBe("Hello!");
  });

  it("throws on a non-2xx response so the chain can move on", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })),
    );

    await expect(provider.completeTurn(request)).rejects.toThrow(/429/);
  });
});
