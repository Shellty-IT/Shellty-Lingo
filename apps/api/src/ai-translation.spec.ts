import { afterEach, describe, expect, it, vi } from "vitest";

import { createTranslationProvider } from "./ai-translation";

const baseEnv = {
  AI_TRANSLATION_ENABLED: true,
  AI_PROVIDER_ORDER: ["groq"],
  GROQ_API_KEY: "test-key",
  GROQ_MODEL: "llama-3.3-70b-versatile",
  GEMINI_API_KEY: undefined,
  GEMINI_MODEL: "gemini-2.0-flash",
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
});
