/* Async act flushes React effects after the callback. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { Pressable } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCopy } from "@shellty/i18n";
import type {
  ListeningAttemptResponse,
  ListeningChallenge,
} from "@shellty/api-contracts";

const ports = vi.hoisted(() => ({
  challenges: [] as ListeningChallenge[],
  mutate: vi.fn(),
}));

vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock("expo-audio", () => ({
  AudioModule: { requestRecordingPermissionsAsync: vi.fn() },
  RecordingPresets: { HIGH_QUALITY: {} },
  setAudioModeAsync: vi.fn(),
  useAudioPlayer: () => ({ pause: vi.fn() }),
  useAudioPlayerStatus: () => ({ currentTime: 0 }),
  useAudioRecorder: () => ({}),
  useAudioRecorderState: () => ({ isRecording: false, durationMillis: 0 }),
}));
vi.mock("./queries/listening", () => ({
  useListeningChallenges: () => ({
    data: ports.challenges,
    isSuccess: true,
    isLoading: false,
    isError: false,
  }),
  useListeningAttempt: () => ({ mutate: ports.mutate, isPending: false }),
}));
vi.mock("./local-recording", () => ({ discardLocalRecording: vi.fn() }));
vi.mock("./queries/release", () => ({ sendTelemetry: vi.fn() }));
vi.mock("./speech", () => ({ speak: vi.fn() }));
vi.mock("./ui/speech-rate-control", () => ({ SpeechRateControl: () => null }));
vi.mock("./ui/state-panel", () => ({ StatePanel: () => null }));

import { ListeningLab } from "./listening-lab";

const copy = getCopy("pl");
const challenge = (id: string, attempted: boolean): ListeningChallenge => ({
  id,
  language: "en",
  level: "B2",
  title: id,
  instruction: "Listen",
  audio: { text: "Hello", locale: "en-GB", rate: 1 },
  options: [{ id: "a", text: "Answer" }],
  attempted,
  correct: attempted,
});

const render = async () => {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(
      createElement(ListeningLab, {
        token: "token",
        locale: "pl",
        language: "en",
        speakingEnabled: false,
        onBack: vi.fn(),
      }),
    );
  });
  return renderer;
};

const press = async (renderer: ReactTestRenderer, label: string) => {
  const button = renderer.root
    .findAllByType(Pressable)
    .find((item) => item.props.accessibilityLabel === label);
  expect(button).toBeDefined();
  const onPress = (button!.props as { onPress: () => void }).onPress;
  await act(async () => {
    onPress();
  });
};

describe("ListeningLab completion", () => {
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    ports.mutate.mockReset();
  });

  it("opens a saved completed set at the summary", async () => {
    ports.challenges = [challenge("one", true), challenge("two", true)];
    const renderer = await render();

    expect(JSON.stringify(renderer.toJSON())).toContain(
      copy.listeningSummaryTitle,
    );
    expect(JSON.stringify(renderer.toJSON())).toContain(
      copy.listeningPracticeAgain,
    );
  });

  it("skips saved attempts and shows the summary after the last unanswered challenge", async () => {
    ports.challenges = [challenge("two", false), challenge("one", true)];
    ports.mutate.mockImplementation(
      (
        _input: unknown,
        options: { onSuccess: (result: ListeningAttemptResponse) => void },
      ) =>
        options.onSuccess({
          challengeId: "two",
          correct: true,
          transcript: "Hello",
          explanation: "Correct",
          nextChallengeId: null,
        }),
    );
    const renderer = await render();

    await press(renderer, "Answer");
    await press(renderer, copy.listeningCheck);
    await press(renderer, copy.listeningShowSummary);

    expect(JSON.stringify(renderer.toJSON())).toContain(
      copy.listeningSummaryTitle,
    );
    expect(JSON.stringify(renderer.toJSON())).toContain(
      '"children":["Ukończone",": ","2","/","2"]',
    );
  });
});
