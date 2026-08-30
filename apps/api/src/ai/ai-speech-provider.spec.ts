import { describe, expect, it, vi } from "vitest";

import {
  CompositeSpeechProvider,
  createSpeechProvider,
  type SpeechProvider,
  type SpeechTranscriptionRequest,
} from "./ai-speech-provider";

const request: SpeechTranscriptionRequest = {
  language: "en",
  mimeType: "audio/m4a",
  audioBase64: "YWJj",
};

describe("speech provider fallback", () => {
  it("uses the next provider when the first transcription fails", async () => {
    const firstTranscribe = vi.fn().mockRejectedValue(new Error("timeout"));
    const secondTranscribe = vi
      .fn()
      .mockResolvedValue({ text: "I cannot log in.", confidence: 0.91 });
    const first: SpeechProvider = {
      name: "first",
      transcribe: firstTranscribe,
    };
    const second: SpeechProvider = {
      name: "second",
      transcribe: secondTranscribe,
    };
    const provider = new CompositeSpeechProvider([first, second]);

    await expect(provider.transcribe(request)).resolves.toEqual({
      text: "I cannot log in.",
      confidence: 0.91,
    });
    expect(firstTranscribe).toHaveBeenCalledOnce();
    expect(secondTranscribe).toHaveBeenCalledOnce();
  });

  it("returns a stable service error when no provider is configured", async () => {
    const provider = new CompositeSpeechProvider([]);

    await expect(provider.transcribe(request)).rejects.toMatchObject({
      response: {
        code: "VOICE_TRANSCRIPTION_UNAVAILABLE",
      },
    });
  });

  it("does not send deprecated sampling parameters to Gemini 3.x", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "Hello." }] } }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const provider = createSpeechProvider({
      AI_PROVIDER_ORDER: ["gemini"],
      GEMINI_API_KEY: "test-key",
      GEMINI_SPEECH_MODEL: "gemini-3.6-flash",
      GROQ_API_KEY: undefined,
      GROQ_SPEECH_MODEL: "whisper-large-v3-turbo",
      AI_REQUEST_TIMEOUT_MS: 5000,
      AI_MAX_RETRIES: 0,
    } as never);

    await provider.transcribe(request);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      generationConfig: Record<string, unknown>;
    };
    expect(payload.generationConfig).not.toHaveProperty("temperature");
  });
});
