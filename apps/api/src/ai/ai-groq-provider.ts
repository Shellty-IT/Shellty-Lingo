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
  type ChatMessage,
} from "./ai-prompt";
import { assertAiHttpResponse, fetchWithTimeout, withRetry } from "./ai-http";

export interface GroqProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  endpoint?: string;
}

const defaultEndpoint = "https://api.groq.com/openai/v1/chat/completions";

interface GroqResponse {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/** Groq adapter using the OpenAI-compatible chat completions API. */
export class GroqProvider implements AiProvider {
  readonly name = "groq";

  constructor(private readonly config: GroqProviderConfig) {}

  async completeTurn(request: AiTurnRequest): Promise<AiTurnResult> {
    const history = conversationHistory(request).map(
      (message: ChatMessage) => ({
        role: message.role,
        content: message.text,
      }),
    );
    if (history[0]?.role === "assistant")
      history.unshift({
        role: "user",
        content:
          "Start the role-play now with the opening line in the next message.",
      });
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: conversationSystemPrompt(request) },
      ...history,
    ];

    return withRetry(async () => {
      const response = await fetchWithTimeout(
        this.config.endpoint ?? defaultEndpoint,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.config.apiKey}`,
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            temperature: 0.6,
            max_completion_tokens: 768,
            reasoning_effort: "low",
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "language_tutor_turn",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["text", "correction"],
                  properties: {
                    text: { type: "string", minLength: 1, maxLength: 1000 },
                    correction: {
                      anyOf: [
                        { type: "null" },
                        {
                          type: "object",
                          additionalProperties: false,
                          required: ["original", "corrected", "explanation"],
                          properties: {
                            original: { type: "string", maxLength: 1200 },
                            corrected: { type: "string", maxLength: 1200 },
                            explanation: { type: "string", maxLength: 2000 },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          }),
        },
        this.config.timeoutMs,
      );
      assertAiHttpResponse(response, "Groq");
      const body = (await response.json()) as GroqResponse;
      const choice = body.choices?.[0];
      const content = choice?.message?.content;
      if (!content) throw new Error("Groq response had no message content.");
      const turn = parseConversationTurn(content);
      return assertAiResult({
        text: turn.text,
        ...(turn.correction ? { correction: turn.correction } : {}),
        inputTokens:
          body.usage?.prompt_tokens ??
          estimateTokens(messages.map((message) => message.content).join(" ")),
        outputTokens:
          body.usage?.completion_tokens ?? estimateTokens(turn.text),
        finishReason: choice?.finish_reason === "length" ? "length" : "stop",
      });
    }, this.config.maxRetries);
  }
}
