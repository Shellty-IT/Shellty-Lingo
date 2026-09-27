/* Async act waits for effects and asynchronous audio ports. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCopy } from "@shellty/i18n";
const ports = vi.hoisted(() => ({
  api: vi.fn(),
  speak: vi.fn(),
  stop: vi.fn(),
  reading: vi.fn(),
  active: vi.fn(),
  player: {
    replace: vi.fn(),
    setPlaybackRate: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
  },
  status: {
    playing: false,
    didJustFinish: false,
    error: null as string | null,
  },
}));
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  AppState: { addEventListener: ports.active },
  StyleSheet: { create: (value: unknown) => value },
}));
vi.mock("expo-audio", () => ({
  useAudioPlayer: () => ports.player,
  useAudioPlayerStatus: () => ports.status,
  setAudioModeAsync: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../api", () => ({ apiRequest: ports.api }));
vi.mock("../queries/release", () => ({ sendTelemetry: vi.fn() }));
vi.mock("../speech", () => ({ speak: ports.speak, stopSpeech: ports.stop }));
vi.mock("../ui/speech-rate-control", () => ({ SpeechRateControl: () => null }));
import { LessonAudioControls } from "./lesson-audio-controls";
import { SmallButton } from "./shared";
const copy = getCopy("pl");
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};
describe("lesson audio recovery and cancellation", () => {
  let renderer: ReactTestRenderer;
  const element = (mediaAssetId: string | undefined = "audio") =>
    createElement(LessonAudioControls, {
      token: "token",
      sessionId: "session",
      exercise: {
        id: "exercise",
        type: "listening",
        prompt: "Hello",
        position: 1,
        mediaAssetId,
      },
      language: "en",
      copy,
      disabled: false,
      reading: false,
      onReading: ports.reading,
    });
  const press = async (label: string) => {
    const node = renderer.root
      .findAllByType(SmallButton)
      .find((item) => (item.props as { label: string }).label === label)!;
    expect(node).toBeDefined();
    await act(async () => (node.props as { onPress: () => void }).onPress());
  };
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.clearAllMocks();
    ports.status = { playing: false, didJustFinish: false, error: null };
    ports.api.mockResolvedValue({
      url: "https://example.test/signed",
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    });
    ports.stop.mockResolvedValue(undefined);
    ports.speak.mockResolvedValue(undefined);
    ports.active.mockReturnValue({ remove: vi.fn() });
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    vi.useRealTimers();
  });
  it("plays the authorized recording before using TTS", async () => {
    await act(async () => {
      renderer = create(element());
    });
    await press(copy.listen);
    expect(ports.api).toHaveBeenCalledWith(
      "/learning/sessions/session/exercises/exercise/audio",
      { token: "token" },
    );
    expect(ports.player.replace).toHaveBeenCalledWith({
      uri: "https://example.test/signed",
    });
    expect(ports.player.play).toHaveBeenCalledOnce();
    expect(ports.speak).not.toHaveBeenCalled();
  });
  it("labels the TTS fallback when a recording is unavailable", async () => {
    ports.api.mockRejectedValue(new Error("not configured"));
    await act(async () => {
      renderer = create(element());
    });
    await press(copy.listen);
    expect(ports.speak).toHaveBeenCalledWith(
      "Hello",
      "en",
      1,
      expect.any(Function),
    );
    expect(JSON.stringify(renderer.toJSON())).toContain(copy.audioSynthetic);
  });
  it("allows reading when both recording and system voice fail", async () => {
    ports.api.mockRejectedValue(new Error("recording unavailable"));
    ports.speak.mockRejectedValue(new Error("voice unavailable"));
    await act(async () => {
      renderer = create(element());
    });
    await press(copy.listen);
    expect(JSON.stringify(renderer.toJSON())).toContain(
      copy.audioUnavailableReading,
    );
    await press(copy.readingAlternative);
    expect(ports.reading).toHaveBeenCalledOnce();
    expect(ports.stop).toHaveBeenCalled();
  });
  it("ignores a signed URL that arrives after Stop", async () => {
    const response = deferred<{ url: string }>();
    ports.api.mockReturnValue(response.promise);
    await act(async () => {
      renderer = create(element());
    });
    await press(copy.listen);
    await press(copy.audioStop);
    await act(async () => response.resolve({ url: "https://late.test/audio" }));
    expect(ports.player.play).not.toHaveBeenCalled();
  });
  it("ignores a recording response after bounded loading switches to TTS", async () => {
    vi.useFakeTimers();
    const response = deferred<{ url: string }>();
    ports.api.mockReturnValue(response.promise);
    await act(async () => {
      renderer = create(element());
    });
    await press(copy.listen);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12001);
    });
    expect(ports.speak).toHaveBeenCalledOnce();
    await act(async () => response.resolve({ url: "https://late.test/audio" }));
    expect(ports.player.replace).not.toHaveBeenCalled();
  });
  it("stops playback on unmount and when going into the background", async () => {
    await act(async () => {
      renderer = create(element());
    });
    await press(copy.listen);
    const onState = ports.active.mock.calls[0]?.[1] as (state: string) => void;
    await act(async () => onState("background"));
    expect(ports.player.pause).toHaveBeenCalled();
    ports.stop.mockClear();
    await act(async () => renderer.unmount());
    expect(ports.stop).toHaveBeenCalledOnce();
  });
});
