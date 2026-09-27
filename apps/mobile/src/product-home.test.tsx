/* Async act waits for React effects after navigation. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement, forwardRef, useImperativeHandle } from "react";
import type { TextInput } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const ports = vi.hoisted(() => ({
  scroll: vi.fn(),
  dismiss: vi.fn(),
  keyboard: vi.fn(),
  telemetry: vi.fn(),
}));
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  KeyboardAvoidingView: "KeyboardAvoidingView",
  Platform: { OS: "ios" },
  StyleSheet: { create: (value: unknown) => value },
  Keyboard: { dismiss: ports.dismiss, addListener: ports.keyboard },
  ScrollView: forwardRef((_props, ref) => {
    useImperativeHandle(ref, () => ({
      scrollTo: ports.scroll,
      getNativeScrollRef: () => ({
        measureInWindow: (callback: (x: number, y: number) => void) =>
          callback(0, 100),
      }),
    }));
    return createElement("ScrollView", _props);
  }),
}));
vi.mock("./home/chat-tab", () => ({ ChatTab: () => null }));
vi.mock("./home/progress-tab", () => ({ ProgressTab: () => null }));
vi.mock("./home/profile-tab", () => ({ ProfileTab: () => null }));
vi.mock("./home/thai-tab", () => ({ ThaiTab: () => null }));
vi.mock("./home/today-tab", () => ({ TodayTab: () => null }));
vi.mock("./home/learn-tab", () => ({ LearnTab: () => null }));
vi.mock("./home/nav-bar", () => ({ NavBar: () => null }));
vi.mock("./listening-lab", () => ({ ListeningLab: () => null }));
vi.mock("./queries/release", () => ({
  useReleaseConfig: () => ({ data: { flags: [] } }),
  sendTelemetry: ports.telemetry,
}));
import { ProductHome } from "./product-home";
import { LearnTab } from "./home/learn-tab";
import { NavBar } from "./home/nav-bar";

describe("exercise viewport and keyboard", () => {
  let renderer: ReactTestRenderer;
  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.clearAllMocks();
    ports.keyboard.mockReturnValue({ remove: vi.fn() });
    await act(async () => {
      renderer = create(
        createElement(ProductHome, {
          token: "token",
          locale: "pl",
          language: "en",
          displayName: "Learner",
          email: "learner@example.test",
          onCourseChange: vi.fn(),
          onSignOut: vi.fn(),
        }),
      );
    });
    await act(async () =>
      (
        renderer.root.findByType(NavBar).props as {
          onSelect: (tab: string) => void;
        }
      ).onSelect("learn"),
    );
    ports.scroll.mockClear();
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
    vi.useRealTimers();
  });
  const learn = () =>
    renderer.root.findByType(LearnTab).props as {
      onExerciseChange: () => void;
      onAnswerFocus: (input: TextInput) => void;
    };
  const input = {
    measureInWindow: (callback: (x: number, y: number) => void) =>
      callback(0, 400),
  } as TextInput;
  it("scrolls to the measured input instead of the bottom of all content", async () => {
    await act(async () => learn().onAnswerFocus(input));
    expect(ports.scroll).toHaveBeenCalledWith({ y: 284, animated: true });
    const onKeyboard = ports.keyboard.mock.calls[0]?.[1] as () => void;
    await act(async () => onKeyboard());
    expect(ports.scroll).toHaveBeenCalledTimes(2);
  });
  it("resets position and dismisses the keyboard on the next exercise", async () => {
    await act(async () => learn().onExerciseChange());
    expect(ports.scroll).toHaveBeenLastCalledWith({ y: 0, animated: false });
    expect(ports.dismiss).toHaveBeenCalledOnce();
  });
  it("does not apply an old delayed input scroll after changing exercise", async () => {
    vi.useFakeTimers();
    await act(async () => learn().onAnswerFocus(input));
    await act(async () => learn().onExerciseChange());
    ports.scroll.mockClear();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(ports.scroll).not.toHaveBeenCalled();
  });
});
