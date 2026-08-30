import { afterEach, describe, expect, it, vi } from "vitest";

import type { AiTurnRequest } from "./ai-provider";
import { GeminiProvider } from "./ai-gemini-provider";

const request: AiTurnRequest = {
  language: "en",
  level: "A2",
  scenarioId: "hotel",
  scenarioTitle: "Hotel check-in",
  scenarioGoal: "Check in and ask a practical question.",
  scenarioBriefing:
    "The reservation is for two nights and breakfast starts at 7.",
  learnerRole: "You are the hotel guest.",
  objectives: ["Confirm the reservation.", "Ask about breakfast."],
  role: "receptionist",
  correctionMode: "no_corrections",
  learnerText: "i have a reservation",
  recentMessages: [
    { role: "assistant", text: "Good evening. Do you have a reservation?" },
  ],
};

const provider = new GeminiProvider({
  apiKey: "test-key",
  model: "gemini-3.6-flash",
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
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain("gemini-3.6-flash:generateContent");
    const payload = JSON.parse(init.body as string) as {
      contents: Array<{ role: string; parts: Array<{ text: string }> }>;
      generationConfig: Record<string, unknown>;
    };
    expect(payload.contents.map((entry) => entry.role)).toEqual([
      "user",
      "model",
      "user",
    ]);
    expect(payload.contents[1]?.parts[0]?.text).toContain("reservation");
    expect(payload.generationConfig).not.toHaveProperty("temperature");
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
