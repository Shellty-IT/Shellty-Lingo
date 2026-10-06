/* Async act flushes React effects even when the callback is synchronous. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement, useState } from "react";
import { Pressable, Text, TextInput } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  exerciseTypes,
  type CourseLanguage,
  type ExerciseType,
  type LearnerExercise,
} from "@shellty/api-contracts";
import { getCopy, type Locale } from "@shellty/i18n";
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (value: unknown) => value },
}));
import { ExerciseAnswers } from "./exercise-answers";
import { answerIsReady, orderingOptionText } from "./lesson-presentation";
import { PrimaryButton, SmallButton } from "./shared";

const fixture = (
  type: ExerciseType,
  language: CourseLanguage,
): LearnerExercise => ({
  id: type,
  type,
  position: 1,
  prompt: language === "th" ? "เลือกคำตอบที่เหมาะสม" : "Choose the answer",
  options: [
    { id: "a", text: language === "th" ? "ก่อนดำเนินการ" : "I use C++." },
    { id: "b", text: language === "th" ? "เราต้องประเมิน" : "IT in the U.S." },
  ],
  responseConstraints:
    type === "multiple_choice" ? { selectionCount: 2 } : undefined,
  matching: {
    left: [
      { id: "l1", text: "one" },
      { id: "l2", text: "two" },
    ],
    right: [
      { id: "r1", text: "หนึ่ง" },
      { id: "r2", text: "สอง" },
    ],
  },
});

describe("seven answer formats across interface and course languages", () => {
  let renderer: ReactTestRenderer;
  let state: {
    selected: string[];
    typed: string;
    pairs: Record<string, string>;
  };
  const submitted = vi.fn();
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    submitted.mockClear();
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
  });
  const Harness = ({
    exercise,
    locale,
    expected,
    initialSelected = [],
    initialPairs = {},
  }: {
    exercise: LearnerExercise;
    locale: Locale;
    expected?: unknown;
    initialSelected?: string[];
    initialPairs?: Record<string, string>;
  }) => {
    const [selected, setSelected] = useState(initialSelected);
    const [typed, setTyped] = useState("");
    const [pairs, setPairs] = useState<Record<string, string>>(initialPairs);
    const [left, setLeft] = useState<string | null>(null);
    state = { selected, typed, pairs };
    const ready = answerIsReady(exercise, selected, typed, pairs);
    return createElement(
      "View",
      {},
      createElement(ExerciseAnswers, {
        exercise,
        copy: getCopy(locale),
        locked: expected !== undefined,
        expected,
        selected,
        onSelected: setSelected,
        typedAnswer: typed,
        onTypedAnswer: setTyped,
        pairs,
        onPairs: setPairs,
        activeLeft: left,
        onActiveLeft: setLeft,
        onAnswerFocus: vi.fn(),
        onSubmit: () => {
          submitted(state);
        },
      }),
      createElement(PrimaryButton, {
        label: getCopy(locale).checkAnswer,
        disabled: !ready,
        onPress: () => {
          submitted(state);
        },
      }),
    );
  };
  const pressLabel = async (label: string) => {
    const node = renderer.root
      .findAllByType(Pressable)
      .find(
        (item) =>
          (item.props as { accessibilityLabel: string }).accessibilityLabel ===
          label,
      )!;
    expect(node, label).toBeDefined();
    await act(async () => (node.props as { onPress: () => void }).onPress());
  };
  const cases = exerciseTypes.flatMap((type) =>
    (["pl", "en", "th"] as const).flatMap((locale) =>
      (["en", "th"] as const).map((language) => ({ type, locale, language })),
    ),
  );
  it.each(cases)(
    "completes $type in $locale for $language",
    async ({ type, locale, language }) => {
      const exercise = fixture(type, language);
      await act(async () => {
        renderer = create(createElement(Harness, { exercise, locale }));
      });
      expect(
        (renderer.root.findByType(PrimaryButton).props as { disabled: boolean })
          .disabled,
      ).toBe(true);
      if (type === "gap_fill" || type === "typed_answer")
        await act(async () =>
          (
            renderer.root.findByType(TextInput).props as {
              onChangeText: (text: string) => void;
            }
          ).onChangeText(language === "th" ? "สวัสดีครับ" : "Hello"),
        );
      else if (type === "matching") {
        await pressLabel("one");
        await pressLabel("หนึ่ง");
        await pressLabel("two");
        await pressLabel("สอง");
      } else {
        await pressLabel(
          type === "ordering"
            ? orderingOptionText(exercise.options![0]!.text)
            : exercise.options![0]!.text,
        );
        if (type === "ordering" || type === "multiple_choice")
          await pressLabel(
            type === "ordering"
              ? orderingOptionText(exercise.options![1]!.text)
              : exercise.options![1]!.text,
          );
      }
      const check = renderer.root.findByType(PrimaryButton);
      expect((check.props as { disabled: boolean }).disabled).toBe(false);
      await act(async () => (check.props as { onPress: () => void }).onPress());
      expect(submitted).toHaveBeenCalledWith(state);
    },
  );
  it("marks both swapped ordering positions as incorrect despite using the right IDs", async () => {
    await act(async () => {
      renderer = create(
        createElement(Harness, {
          exercise: fixture("ordering", "en"),
          locale: "pl",
          expected: ["a", "b"],
          initialSelected: ["b", "a"],
        }),
      );
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(
      renderer.root
        .findAllByType(Text)
        .filter(
          (node) =>
            (node.props as { children: unknown }).children === "! Do poprawy",
        ),
    ).toHaveLength(2);
    expect(json).not.toContain("✓ Poprawnie");
  });
  it("marks each matching pair independently", async () => {
    await act(async () => {
      renderer = create(
        createElement(Harness, {
          exercise: fixture("matching", "en"),
          locale: "en",
          expected: { l1: "r1", l2: "r2" },
          initialPairs: { l1: "r1", l2: "r1" },
        }),
      );
    });
    const json = JSON.stringify(renderer.toJSON());
    expect(json).toContain("✓ Correct");
    expect(json).toContain("! Needs correction");
  });
  it("reorders and removes selected parts with accessible buttons", async () => {
    const exercise = fixture("ordering", "en");
    await act(async () => {
      renderer = create(
        createElement(Harness, {
          exercise,
          locale: "en",
          initialSelected: ["b", "a"],
        }),
      );
    });
    const move = renderer.root
      .findAllByType(SmallButton)
      .find(
        (item) =>
          (item.props as { accessibilityLabel: string }).accessibilityLabel ===
          "Move earlier: I use C++",
      )!;
    await act(async () => (move.props as { onPress: () => void }).onPress());
    expect(state.selected).toEqual(["a", "b"]);
    await pressLabel("Remove from your answer: I use C++");
    expect(state.selected).toEqual(["b"]);
  });
  it("shows neutral labels in both the answer and the remaining bank", async () => {
    const exercise: LearnerExercise = {
      ...fixture("ordering", "en"),
      options: [
        { id: "a", text: "Not only did" },
        { id: "b", text: "the team restore the service," },
        { id: "c", text: "but it also documented" },
        { id: "d", text: "the recovery procedure." },
      ],
    };
    await act(async () => {
      renderer = create(
        createElement(Harness, {
          exercise,
          locale: "pl",
          initialSelected: ["a", "b"],
        }),
      );
    });
    const shown = JSON.stringify(renderer.toJSON());
    expect(shown).toContain("The team restore the service");
    expect(shown).toContain("But it also documented");
    expect(shown).toContain("The recovery procedure");
    expect(shown).not.toContain("service,");
    expect(shown).not.toContain("procedure.");
  });
});
