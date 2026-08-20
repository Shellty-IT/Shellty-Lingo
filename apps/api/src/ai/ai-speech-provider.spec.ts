import { describe, expect, it, vi } from "vitest";

import {
  CompositeSpeechProvider,
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
});
