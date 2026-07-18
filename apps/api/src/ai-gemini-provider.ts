import {
  assertAiResult,
  type AiProvider,
  type AiTurnRequest,
  type AiTurnResult,
} from "./ai-provider";
import {
  conversationHistory,
  conversationSystemPrompt,
  estimateTokens,
  parseConversationTurn,
} from "./ai-prompt";
import { fetchWithTimeout, withRetry } from "./ai-http";

export interface GeminiProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  baseUrl?: string;
}

const defaultBaseUrl = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

/** Google Gemini adapter using the Generative Language generateContent API. */
export class GeminiProvider implements AiProvider {
  readonly name = "gemini";

  constructor(private readonly config: GeminiProviderConfig) {}

  async completeTurn(request: AiTurnRequest): Promise<AiTurnResult> {
    // Gemini requires the first turn to be a user turn and roles user/model.
    const contents = geminiContents(request);
    const url = `${this.config.baseUrl ?? defaultBaseUrl}/models/${encodeURIComponent(
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
              parts: [{ text: conversationSystemPrompt(request) }],
            },
            contents,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.6,
              maxOutputTokens: 512,
            },
          }),
        },
        this.config.timeoutMs,
      );
      if (!response.ok)
        throw new Error(
          `Gemini request failed with status ${response.status}.`,
        );
      const body = (await response.json()) as GeminiResponse;
      const candidate = body.candidates?.[0];
      const content = candidate?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("");
      if (!content) throw new Error("Gemini response had no content.");
      const turn = parseConversationTurn(content);
      return assertAiResult({
        text: turn.text,
        ...(turn.correction ? { correction: turn.correction } : {}),
        inputTokens:
          body.usageMetadata?.promptTokenCount ??
          estimateTokens(
            contents
              .flatMap((entry) => entry.parts.map((part) => part.text))
              .join(" "),
          ),
        outputTokens:
          body.usageMetadata?.candidatesTokenCount ?? estimateTokens(turn.text),
        finishReason:
          candidate?.finishReason === "MAX_TOKENS" ? "length" : "stop",
      });
    }, this.config.maxRetries);
  }
}

function geminiContents(
  request: AiTurnRequest,
): Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> {
  const mapped = conversationHistory(request).map((message) => ({
    role: message.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: message.text }],
  }));
  // Drop any leading model turns so the exchange starts with the learner.
  const firstUser = mapped.findIndex((entry) => entry.role === "user");
  return firstUser <= 0 ? mapped : mapped.slice(firstUser);
}
