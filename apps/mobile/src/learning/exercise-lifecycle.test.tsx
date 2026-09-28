/* Async act waits for React effects and their promise chains. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { TextInput } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCopy } from "@shellty/i18n";
import type {
  LearningSessionResponse,
  ReviewAssessment,
  ReviewQueueItem,
  ExerciseTutorHintResult,
} from "@shellty/api-contracts";

const ports = vi.hoisted(() => ({
  hint: vi.fn(),
  dictionary: vi.fn(),
  save: vi.fn(),
  message: vi.fn(),
}));
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  Alert: { alert: vi.fn() },
  AccessibilityInfo: { setAccessibilityFocus: vi.fn() },
  findNodeHandle: () => null,
  StyleSheet: { create: (styles: unknown) => styles },
}));
vi.mock("../api", () => ({
  idempotencyKey: (...parts: string[]) => parts.join(":"),
  ApiRequestError: class extends Error {},
}));
vi.mock("../speech", () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeech: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../queries/release", () => ({ sendTelemetry: vi.fn() }));
vi.mock("../ui/speech-rate-control", () => ({ SpeechRateControl: () => null }));
vi.mock("./dictionary-sheet", () => ({ DictionarySheet: () => null }));
vi.mock("./lesson-audio-controls", () => ({ LessonAudioControls: () => null }));
vi.mock("../queries/learning", () => ({
  useExerciseTutorHint: () => ({ mutate: ports.hint, isPending: false }),
  useDictionaryLookup: () => ({ mutate: ports.dictionary, isPending: false }),
  useSaveDictionary: () => ({ mutate: ports.save, isPending: false }),
}));
vi.mock("./use-reliable-attempt", () => ({
  useReliableAttempt: () => ({
    phase: "draft",
    locked: false,
    persisted: false,
    submit: vi.fn(),
    retry: vi.fn(),
  }),
}));
import { LessonView } from "./lesson-view";
import { ReviewsView } from "./reviews-view";
import { PrimaryButton, SmallButton } from "./shared";

const copy = getCopy("pl");
const lesson: LearningSessionResponse = {
  sessionId: "session",
  resumed: false,
  lesson: {
    slug: "lesson",
    title: "Lesson",
    summary: null,
    estimatedMinutes: 1,
  },
  course: { slug: "course", language: "en", level: "A1", category: "general" },
  attempts: [],
  hints: [],
  exercises: ["first", "second"].map((id) => ({
    id,
    type: "typed_answer",
    prompt: "Write a greeting",
    position: 1,
  })),
};
const review = (id: string): ReviewQueueItem => ({
  id,
  scheduleRevision: 0,
  sourceText: "Write a greeting",
  translation: null,
  context: null,
  explanation: "Explanation",
  usageTip: "Tip",
  answer: {
    mode: "self_assess",
    acceptedAnswers: ["Hello"],
    expectedAnswer: "Hello",
  },
  dueAt: "2020-01-01T00:00:00Z",
  repetitions: 0,
  ratingIntervalsMinutes: { again: 10, hard: 720, good: 1440, easy: 5760 },
});

describe("exercise callback isolation", () => {
  let renderer: ReactTestRenderer;
  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.clearAllMocks();
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
  });
  const lessonElement = (exerciseIndex: number) =>
    createElement(LessonView, {
      key: lesson.exercises[exerciseIndex]?.id,
      token: "token",
      locale: "pl",
      copy,
      lesson,
      exerciseIndex,
      onClose: vi.fn(),
      onAdvance: vi.fn(),
      onMessage: ports.message,
      completing: false,
      onAnswerFocus: vi.fn(),
    });

  it("does not show the previous exercise's tutor hint in the next exercise", async () => {
    await act(async () => {
      renderer = create(lessonElement(0));
    });
    const button = renderer.root
      .findAllByType(SmallButton)
      .find(
        (node) =>
          (node.props as { label: string }).label === copy.tutorHintAction,
      )!;
    await act(async () => (button.props as { onPress: () => void }).onPress());
    const callbacks = ports.hint.mock.calls[0]?.[1] as {
      onSuccess: (result: ExerciseTutorHintResult) => void;
    };
    await act(async () => renderer.update(lessonElement(1)));
    await act(async () =>
      callbacks.onSuccess({
        exerciseId: "first",
        hint: "Old hint",
        focus: "grammar",
        dynamic: true,
      }),
    );
    expect(JSON.stringify(renderer.toJSON())).not.toContain("Old hint");
  });

  it("labels a restored local hint as a fallback", async () => {
    await act(async () => {
      renderer = create(
        createElement(LessonView, {
          key: "first",
          token: "token",
          locale: "pl",
          copy,
          lesson: {
            ...lesson,
            hints: [
              {
                exerciseId: "first",
                hint: "Sprawdź kontekst zadania.",
                focus: "grammar",
                dynamic: false,
              },
            ],
          } satisfies LearningSessionResponse,
          exerciseIndex: 0,
          onClose: vi.fn(),
          onAdvance: vi.fn(),
          onMessage: ports.message,
          completing: false,
          onAnswerFocus: vi.fn(),
        }),
      );
    });
    const rendered = JSON.stringify(renderer.toJSON());
    expect(rendered).toContain(copy.tutorHintFallbackLabel);
    expect(rendered).not.toContain(copy.tutorHintLabel);
  });

  it("does not display a late tutor error after leaving its exercise", async () => {
    await act(async () => {
      renderer = create(lessonElement(0));
    });
    const button = renderer.root
      .findAllByType(SmallButton)
      .find(
        (node) =>
          (node.props as { label: string }).label === copy.tutorHintAction,
      )!;
    await act(async () => (button.props as { onPress: () => void }).onPress());
    const callbacks = ports.hint.mock.calls[0]?.[1] as {
      onError: (error: Error) => void;
    };
    await act(async () => renderer.update(lessonElement(1)));
    ports.message.mockClear();
    await act(async () => callbacks.onError(new Error("late failure")));
    expect(ports.message).not.toHaveBeenCalled();
  });

  it("locks the review input while assessing and shows the submitted snapshot", async () => {
    let resolve!: (value: ReviewAssessment) => void;
    const onAssess = vi.fn(
      () =>
        new Promise<ReviewAssessment>((complete) => {
          resolve = complete;
        }),
    );
    await act(async () => {
      renderer = create(
        createElement(ReviewsView, {
          reviews: [review("first")],
          copy,
          locale: "pl",
          onClose: vi.fn(),
          onRate: vi.fn(),
          onAssess,
          onRetry: vi.fn(),
          onAnswerFocus: vi.fn(),
          disabled: false,
        }),
      );
    });
    await act(async () =>
      (
        renderer.root.findByType(TextInput).props as {
          onChangeText: (value: string) => void;
        }
      ).onChangeText("Hello"),
    );
    await act(async () =>
      (
        renderer.root.findByType(PrimaryButton).props as { onPress: () => void }
      ).onPress(),
    );
    expect(
      (renderer.root.findByType(TextInput).props as { editable: boolean })
        .editable,
    ).toBe(false);
    expect(onAssess).toHaveBeenCalledWith("first", "Hello");
    await act(async () =>
      resolve({
        verdict: "correct",
        score: 1,
        suggestedAnswer: "Hello",
        explanation: "Fine",
        usageTip: "Tip",
        dynamic: true,
      }),
    );
    expect(JSON.stringify(renderer.toJSON())).toContain("Hello");
    expect(renderer.root.findAllByType(TextInput)).toHaveLength(0);
  });
  it("offers skipping an unresolved answer without changing the review schedule", async () => {
    const onRate = vi.fn(),
      onSkip = vi.fn();
    await act(async () => {
      renderer = create(
        createElement(ReviewsView, {
          reviews: [review("first")],
          copy,
          locale: "pl",
          onClose: vi.fn(),
          onRate,
          onSkip,
          onAssess: vi.fn().mockResolvedValue({
            verdict: "needs_review",
            score: 0,
            suggestedAnswer: "Hello",
            explanation: "",
            usageTip: "",
            dynamic: false,
          }),
          onRetry: vi.fn(),
          onAnswerFocus: vi.fn(),
          disabled: false,
        }),
      );
    });
    await act(async () => {
      (
        renderer.root.findByType(TextInput).props as {
          onChangeText: (value: string) => void;
        }
      ).onChangeText("A new greeting");
    });
    await act(async () => {
      (
        renderer.root.findByType(PrimaryButton).props as { onPress: () => void }
      ).onPress();
    });
    expect(JSON.stringify(renderer.toJSON())).toContain(
      copy.assessmentUnresolved,
    );
    const action = renderer.root.findByType(PrimaryButton);
    expect(action.props.label).toBe(copy.skipUnresolved);
    await act(async () => {
      (action.props as { onPress: () => void }).onPress();
    });
    expect(onSkip).toHaveBeenCalledOnce();
    expect(onRate).not.toHaveBeenCalled();
  });
  it("discards an assessment when the review occurrence changes without remounting", async () => {
    let resolve!: (value: ReviewAssessment) => void;
    const onAssess = vi.fn(
      () =>
        new Promise<ReviewAssessment>((done) => {
          resolve = done;
        }),
    );
    const element = (revision: number) =>
      createElement(ReviewsView, {
        reviews: [{ ...review("same"), scheduleRevision: revision }],
        copy,
        locale: "pl",
        onClose: vi.fn(),
        onRate: vi.fn(),
        onAssess,
        onRetry: vi.fn(),
        onAnswerFocus: vi.fn(),
        disabled: false,
      });
    await act(async () => {
      renderer = create(element(0));
    });
    await act(async () => {
      (
        renderer.root.findByType(TextInput).props as {
          onChangeText: (value: string) => void;
        }
      ).onChangeText("Hello");
    });
    await act(async () => {
      (
        renderer.root.findByType(PrimaryButton).props as { onPress: () => void }
      ).onPress();
    });
    await act(async () => {
      renderer.update(element(1));
    });
    await act(async () => {
      resolve({
        verdict: "correct",
        score: 1,
        suggestedAnswer: "Old answer",
        explanation: "Old feedback",
        usageTip: "",
        dynamic: true,
      });
    });
    expect(JSON.stringify(renderer.toJSON())).not.toContain("Old feedback");
    expect(
      renderer.root.findByType(TextInput).props as {
        editable: boolean;
        value: string;
      },
    ).toMatchObject({ editable: true, value: "" });
  });
});
