import { ServiceUnavailableException } from "@nestjs/common";
import type { CourseLanguage } from "@shellty/api-contracts";
import type { ApiEnvironment } from "@shellty/config";

import { fetchWithTimeout, withRetry } from "./ai-http";

export const SPEECH_AI_PROVIDER = Symbol("SPEECH_AI_PROVIDER");

export type SpeechTranscriptionRequest = {
  language: CourseLanguage;
  mimeType:
    | "audio/m4a"
    | "audio/mp4"
    | "audio/webm"
    | "audio/wav"
    | "audio/3gpp";
  audioBase64: string;
};

export interface SpeechProvider {
  readonly name: string;
  transcribe(request: SpeechTranscriptionRequest): Promise<SpeechTranscription>;
}

export type SpeechTranscription = { text: string; confidence?: number };

const validTranscript = (value: unknown): string => {
  if (typeof value !== "string") throw new Error("Transcript is not text.");
  const clean = value
    .trim()
    .replace(/^```(?:text)?\s*|\s*```$/g, "")
    .trim();
  if (!clean || clean.length > 800)
    throw new Error("Transcript length is invalid.");
  return clean;
};

class GeminiSpeechProvider implements SpeechProvider {
  readonly name = "gemini-speech";

  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      timeoutMs: number;
      maxRetries: number;
    },
  ) {}

  transcribe(
    request: SpeechTranscriptionRequest,
  ): Promise<SpeechTranscription> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.config.model)}:generateContent`;
    return withRetry(async () => {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
            "x-goog-api-key": this.config.apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Transcribe this ${request.language === "th" ? "Thai" : "English"} learner recording exactly. Return only the transcript, without commentary.`,
                  },
                  {
                    inlineData: {
                      mimeType: request.mimeType,
                      data: request.audioBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0, maxOutputTokens: 300 },
          }),
        },
        this.config.timeoutMs,
      );
      if (!response.ok)
        throw new Error(`Gemini speech request failed: ${response.status}.`);
      const body = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };
      return {
        text: validTranscript(
          body.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join(""),
        ),
      };
    }, this.config.maxRetries);
  }
}

class GroqSpeechProvider implements SpeechProvider {
  readonly name = "groq-speech";

  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      timeoutMs: number;
      maxRetries: number;
    },
  ) {}

  transcribe(
    request: SpeechTranscriptionRequest,
  ): Promise<SpeechTranscription> {
    return withRetry(async () => {
      const bytes = Buffer.from(request.audioBase64, "base64");
      const extension =
        request.mimeType === "audio/webm"
          ? "webm"
          : request.mimeType === "audio/3gpp"
            ? "3gp"
            : request.mimeType === "audio/wav"
              ? "wav"
              : "m4a";
      const form = new FormData();
      form.append("model", this.config.model);
      form.append("language", request.language);
      form.append("response_format", "verbose_json");
      form.append(
        "file",
        new Blob([bytes], { type: request.mimeType }),
        `learner.${extension}`,
      );
      const response = await fetchWithTimeout(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { authorization: `Bearer ${this.config.apiKey}` },
          body: form,
        },
        this.config.timeoutMs,
      );
      if (!response.ok)
        throw new Error(`Groq speech request failed: ${response.status}.`);
      const body = (await response.json()) as {
        text?: string;
        segments?: Array<{ avg_logprob?: number; no_speech_prob?: number }>;
      };
      const usable = (body.segments ?? []).filter(
        (segment) =>
          typeof segment.avg_logprob === "number" &&
          (segment.no_speech_prob ?? 0) < 0.65,
      );
      const confidence = body.segments?.length
        ? usable.length
          ? Math.max(
              0,
              Math.min(
                1,
                usable.reduce(
                  (sum, segment) => sum + Math.exp(segment.avg_logprob!),
                  0,
                ) / usable.length,
              ),
            )
          : 0
        : undefined;
      return {
        text: validTranscript(body.text),
        ...(confidence === undefined ? {} : { confidence }),
      };
    }, this.config.maxRetries);
  }
}

export class CompositeSpeechProvider implements SpeechProvider {
  readonly name = "composite-speech";

  constructor(private readonly providers: SpeechProvider[]) {}

  async transcribe(
    request: SpeechTranscriptionRequest,
  ): Promise<SpeechTranscription> {
    for (const provider of this.providers) {
      try {
        return await provider.transcribe(request);
      } catch {
        // Try the next configured provider without logging learner audio or text.
      }
    }
    throw new ServiceUnavailableException({
      code: "VOICE_TRANSCRIPTION_UNAVAILABLE",
      message: "Voice transcription is temporarily unavailable.",
    });
  }
}

export const createSpeechProvider = (
  environment: ApiEnvironment,
): CompositeSpeechProvider => {
  const providers: SpeechProvider[] = [];
  const shared = {
    timeoutMs: environment.AI_REQUEST_TIMEOUT_MS,
    maxRetries: environment.AI_MAX_RETRIES,
  };
  for (const name of environment.AI_PROVIDER_ORDER) {
    if (name === "gemini" && environment.GEMINI_API_KEY)
      providers.push(
        new GeminiSpeechProvider({
          apiKey: environment.GEMINI_API_KEY,
          model: environment.GEMINI_SPEECH_MODEL,
          ...shared,
        }),
      );
    if (name === "groq" && environment.GROQ_API_KEY)
      providers.push(
        new GroqSpeechProvider({
          apiKey: environment.GROQ_API_KEY,
          model: environment.GROQ_SPEECH_MODEL,
          ...shared,
        }),
      );
  }
  return new CompositeSpeechProvider(providers);
};
