import { afterEach, describe, expect, it, vi } from "vitest";

import { createTranslationProvider } from "./ai-translation";

const baseEnv = {
  AI_TRANSLATION_ENABLED: true,
  AI_PROVIDER_ORDER: ["groq"],
  GROQ_API_KEY: "test-key",
  GROQ_MODEL: "openai/gpt-oss-120b",
  GEMINI_API_KEY: undefined,
  GEMINI_MODEL: "gemini-3.6-flash",
  AI_REQUEST_TIMEOUT_MS: 5000,
  AI_MAX_RETRIES: 0,
} as never;

afterEach(() => vi.restoreAllMocks());

describe("createTranslationProvider", () => {
  it("returns null when translation is disabled", () => {
    expect(
      createTranslationProvider({
        ...(baseEnv as object),
        AI_TRANSLATION_ENABLED: false,
      } as never),
    ).toBeNull();
  });

  it("returns null when no provider key is configured", () => {
    expect(
      createTranslationProvider({
        ...(baseEnv as object),
        GROQ_API_KEY: undefined,
      } as never),
    ).toBeNull();
  });

  it("translates a selection through the configured provider", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: JSON.stringify({ translation: "kawa" }) } },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const translator = createTranslationProvider(baseEnv);
    expect(translator).not.toBeNull();
    const result = await translator!.translate({
      text: "coffee",
      sourceLanguage: "en",
      targetLocale: "pl",
    });
    expect(result).toBe("kawa");
  });

  it("does not send deprecated sampling parameters to Gemini 3.x", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ translation: "coffee" }) }],
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const translator = createTranslationProvider({
      ...(baseEnv as object),
      AI_PROVIDER_ORDER: ["gemini"],
      GROQ_API_KEY: undefined,
      GEMINI_API_KEY: "test-key",
    } as never);

    await translator!.translate({
      text: "kawa",
      sourceLanguage: "en",
      targetLocale: "en",
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      generationConfig: Record<string, unknown>;
    };
    expect(payload.generationConfig).not.toHaveProperty("temperature");
  });
});
