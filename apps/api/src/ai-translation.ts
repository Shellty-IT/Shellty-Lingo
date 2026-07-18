import type { ApiEnvironment } from "@shellty/config";
import type { CourseLanguage, InterfaceLocale } from "@shellty/api-contracts";

import { AiCircuitBreaker } from "./ai-provider";
import { fetchWithTimeout, withRetry } from "./ai-http";

export const TRANSLATION_AI_PROVIDER = Symbol("TRANSLATION_AI_PROVIDER");

export interface TranslationRequest {
  text: string;
  sourceLanguage: CourseLanguage;
  targetLocale: InterfaceLocale;
}

export interface TranslationAi {
  translate(request: TranslationRequest): Promise<string>;
}

const languageName: Record<CourseLanguage | InterfaceLocale, string> = {
  en: "English",
  th: "Thai",
  pl: "Polish",
};

const MAX_SOURCE_LENGTH = 500;

function translationSystemPrompt(request: TranslationRequest): string {
  return [
    `Translate the ${languageName[request.sourceLanguage]} text into ${languageName[request.targetLocale]}.`,
    "Translate the meaning of the word or phrase only — no explanations, transliteration or extra words.",
    'Respond with a single minified JSON object and nothing else: {"translation": string}.',
  ].join(" ");
}

function parseTranslation(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start)
    throw new Error("Translation response contained no JSON object.");
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    translation?: unknown;
  };
  if (typeof parsed.translation !== "string" || !parsed.translation.trim())
    throw new Error("Translation response was missing `translation`.");
  return parsed.translation.trim();
}

interface TranslatorConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
}

class GroqTranslator implements TranslationAi {
  readonly name = "groq";
  constructor(
    private readonly config: TranslatorConfig,
    private readonly endpoint = "https://api.groq.com/openai/v1/chat/completions",
  ) {}

  translate(request: TranslationRequest): Promise<string> {
    return withRetry(async () => {
      const response = await fetchWithTimeout(
        this.endpoint,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.config.apiKey}`,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            model: this.config.model,
            temperature: 0,
            max_tokens: 256,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: translationSystemPrompt(request) },
              {
                role: "user",
                content: request.text.slice(0, MAX_SOURCE_LENGTH),
              },
            ],
          }),
        },
        this.config.timeoutMs,
      );
      if (!response.ok)
        throw new Error(
          `Groq translation failed with status ${response.status}.`,
        );
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq translation had no content.");
      return parseTranslation(content);
    }, this.config.maxRetries);
  }
}

class GeminiTranslator implements TranslationAi {
  readonly name = "gemini";
  constructor(
    private readonly config: TranslatorConfig,
    private readonly baseUrl = "https://generativelanguage.googleapis.com/v1beta",
  ) {}

  translate(request: TranslationRequest): Promise<string> {
    const url = `${this.baseUrl}/models/${encodeURIComponent(
      this.config.model,
    )}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;
    return withRetry(async () => {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: translationSystemPrompt(request) }],
            },
            contents: [
              {
                role: "user",
                parts: [{ text: request.text.slice(0, MAX_SOURCE_LENGTH) }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0,
            },
          }),
        },
        this.config.timeoutMs,
      );
      if (!response.ok)
        throw new Error(
          `Gemini translation failed with status ${response.status}.`,
        );
      const body = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const content = body.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("");
      if (!content) throw new Error("Gemini translation had no content.");
      return parseTranslation(content);
    }, this.config.maxRetries);
  }
}

/**
 * Ordered translation chain with per-provider circuit breakers. Unlike the
 * conversation chain there is no deterministic last resort: when no provider can
 * translate, translate() throws and the caller falls back to "no translation".
 */
class CompositeTranslator implements TranslationAi {
  private readonly breakers: Map<string, AiCircuitBreaker>;
  constructor(
    private readonly providers: Array<TranslationAi & { name: string }>,
  ) {
    this.breakers = new Map(
      providers.map((provider) => [provider.name, new AiCircuitBreaker()]),
    );
  }

  async translate(request: TranslationRequest): Promise<string> {
    let lastError: unknown;
    for (const provider of this.providers) {
      const breaker = this.breakers.get(provider.name);
      if (breaker && !breaker.canRequest()) continue;
      try {
        const translation = await provider.translate(request);
        breaker?.success();
        return translation;
      } catch (error) {
        breaker?.failure();
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("No translation provider available.");
  }
}

/**
 * Build the translation provider from configuration, or null when translation is
 * disabled or no provider key is present. A null result means the dictionary
 * keeps its original behaviour (reviewed content only).
 */
export function createTranslationProvider(
  env: ApiEnvironment,
): TranslationAi | null {
  if (!env.AI_TRANSLATION_ENABLED) return null;
  const shared = {
    timeoutMs: env.AI_REQUEST_TIMEOUT_MS,
    maxRetries: env.AI_MAX_RETRIES,
  };
  const providers: Array<TranslationAi & { name: string }> = [];
  for (const name of env.AI_PROVIDER_ORDER) {
    if (name === "gemini" && env.GEMINI_API_KEY)
      providers.push(
        new GeminiTranslator({
          apiKey: env.GEMINI_API_KEY,
          model: env.GEMINI_MODEL,
          ...shared,
        }),
      );
    if (name === "groq" && env.GROQ_API_KEY)
      providers.push(
        new GroqTranslator({
          apiKey: env.GROQ_API_KEY,
          model: env.GROQ_MODEL,
          ...shared,
        }),
      );
  }
  return providers.length > 0 ? new CompositeTranslator(providers) : null;
}
