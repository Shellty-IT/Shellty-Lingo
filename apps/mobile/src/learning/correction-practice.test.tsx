/* React act flushes effects and promise handlers. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { TextInput } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCopy } from "@shellty/i18n";
import type { ExerciseCorrectionResult } from "@shellty/api-contracts";
const ports = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (value: unknown) => value },
}));
vi.mock("../api", () => ({
  apiRequest: ports.request,
  idempotencyKey: (...parts: string[]) => parts.join(":"),
}));
import { CorrectionPractice } from "./correction-practice";
import { PrimaryButton, SmallButton } from "./shared";
const copy = getCopy("pl");
const saved: ExerciseCorrectionResult = {
  id: "correction",
  originalAttemptId: "attempt",
  attemptOrdinal: 2,
  correct: true,
  score: 1,
  assisted: true,
  alreadyRecorded: true,
  assessment: {
    status: "graded",
    policyVersion: "answer-v2",
    rubricVersion: "reference-v1",
    answerLanguage: "en",
    source: "reference",
  },
};
let renderer: ReactTestRenderer;
beforeEach(() => {
  ports.request.mockReset().mockResolvedValue(null);
});
afterEach(async () => {
  await act(async () => renderer?.unmount());
});
const mount = async (onBusy = vi.fn()) => {
  await act(async () => {
    renderer = create(
      createElement(CorrectionPractice, {
        token: "token",
        attemptId: "attempt",
        copy,
        onBusy,
      }),
    );
  });
  await act(async () => {
    (
      renderer.root.findByType(SmallButton).props as { onPress: () => void }
    ).onPress();
  });
};
describe("correction recovery", () => {
  it("restores a saved correction without allowing another submission", async () => {
    ports.request.mockResolvedValue(saved);
    await mount();
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
    expect(JSON.stringify(renderer.toJSON())).toContain(copy.correctionSaved);
    expect(ports.request).toHaveBeenCalledOnce();
  });
  it("freezes the payload after transport failure and replays it on retry", async () => {
    const busy = vi.fn();
    await mount(busy);
    await act(async () => {
      (
        renderer.root.findByType(TextInput).props as {
          onChangeText: (text: string) => void;
        }
      ).onChangeText("meet");
    });
    ports.request.mockRejectedValueOnce(new Error("Timeout after server save"));
    await act(async () => {
      (
        renderer.root.findByType(PrimaryButton).props as { onPress: () => void }
      ).onPress();
    });
    expect(
      (renderer.root.findByType(TextInput).props as { editable: boolean })
        .editable,
    ).toBe(false);
    ports.request.mockResolvedValueOnce(saved);
    await act(async () => {
      (
        renderer.root.findByType(PrimaryButton).props as { onPress: () => void }
      ).onPress();
    });
    const first = ports.request.mock.calls[1] as [string, { body: unknown }];
    const retry = ports.request.mock.calls[2] as [string, { body: unknown }];
    expect(first[1].body).toEqual({
      answer: "meet",
      idempotencyKey: "correction:attempt",
    });
    expect(retry[1].body).toEqual(first[1].body);
    expect(busy.mock.calls).toEqual([[true], [false], [true], [false]]);
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
  });
});
