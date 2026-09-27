import { beforeEach, describe, expect, it, vi } from "vitest";
const ports = vi.hoisted(() => ({
  voices: vi.fn(),
  speak: vi.fn(),
  stop: vi.fn(),
}));
vi.mock("expo-speech", () => ({
  getAvailableVoicesAsync: ports.voices,
  speak: ports.speak,
  stop: ports.stop,
}));
import { speak, stopSpeech } from "./speech";
describe("system speech lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ports.stop.mockResolvedValue(undefined);
  });
  it("does not start speaking after cancellation during voice discovery", async () => {
    let resolve!: (voices: Array<{ language: string }>) => void;
    ports.voices.mockReturnValue(
      new Promise((complete) => {
        resolve = complete;
      }),
    );
    const playing = speak("Hello", "en", 1);
    await stopSpeech();
    resolve([{ language: "en-US" }]);
    await playing;
    expect(ports.speak).not.toHaveBeenCalled();
  });
  it("reports a missing Thai voice instead of reading with a wrong language", async () => {
    ports.voices.mockResolvedValue([{ language: "en-US" }]);
    await expect(speak("สวัสดี", "th", 1)).rejects.toThrow("voice unavailable");
    expect(ports.speak).not.toHaveBeenCalled();
  });
});
