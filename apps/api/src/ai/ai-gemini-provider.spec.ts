import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiTurnRequest } from "./ai-provider";
import { GeminiProvider } from "./ai-gemini-provider";

const request: AiTurnRequest = {
  language: "en",
  level: "A2",
  scenarioId: "hotel",
  role: "receptionist",
  correctionMode: "no_corrections",
  learnerText: "i have a reservation",
  recentMessages: [],
};

const provider = new GeminiProvider({
  apiKey: "test-key",
  model: "gemini-2.0-flash",
  timeoutMs: 5000,
  maxRetries: 0,
});

afterEach(() => vi.restoreAllMocks());

describe("GeminiProvider", () => {
  it("maps a generateContent response into a validated turn", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      text: "Welcome. May I have your name?",
                      correction: null,
                    }),
                  },
                ],
              },
              finishReason: "STOP",
            },
          ],
          usageMetadata: { promptTokenCount: 30, candidatesTokenCount: 8 },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await provider.completeTurn(request);

    expect(result.text).toBe("Welcome. May I have your name?");
    expect(result.correction).toBeUndefined();
    expect(result.inputTokens).toBe(30);
    expect(result.outputTokens).toBe(8);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain("gemini-2.0-flash:generateContent");
  });

  it("throws when the model returns no JSON object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "not json at all" }] } }],
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(provider.completeTurn(request)).rejects.toThrow();
  });
});
