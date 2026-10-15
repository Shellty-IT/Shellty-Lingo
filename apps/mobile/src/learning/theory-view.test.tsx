/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCopy } from "@shellty/i18n";
import type { LearningDashboard } from "@shellty/api-contracts";
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (styles: unknown) => styles },
}));
import { TheoryView } from "./theory-view";
import { theoryLessons } from "./theory-content";
import { PrimaryButton, SmallButton } from "./shared";

describe("theory reading flow", () => {
  let renderer: ReactTestRenderer;
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
  });
  it("opens a B2 reading lesson, explains rules before practice, and permits revisiting A1", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const onStartLesson = vi.fn();
    const onClose = vi.fn();
    const dashboard = {
      level: "B2",
      courses: [
        {
          slug: "english-b2",
          modules: [
            {
              lessons: [
                {
                  slug: "conditionals-and-regrets-b2",
                  title: "Ćwiczenia warunkowe",
                },
              ],
            },
          ],
        },
      ],
    } as unknown as LearningDashboard;
    const copy = getCopy("pl");
    await act(async () => {
      renderer = create(
        createElement(TheoryView, {
          language: "en",
          locale: "pl",
          copy,
          dashboard,
          onStartLesson,
          onClose,
          disabled: false,
        }),
      );
    });
    expect(JSON.stringify(renderer.toJSON())).toContain(copy.categoryTheory);
    const second = theoryLessons.find(
      (lesson) => lesson.id === "en-second-conditional",
    )!;
    const button = renderer.root.findAll(
      (node) =>
        String(node.type) === "Pressable" &&
        node.props.accessibilityLabel === `${second.title.pl}, B2`,
    )[0]!;
    await act(async () => {
      (button.props as { onPress(): void }).onPress();
    });
    const rendered = JSON.stringify(renderer.toJSON());
    expect(rendered).toContain(second.rule.pl);
    expect(rendered).toContain(second.examples[0]!.meaning.pl);
    expect(rendered).toContain(second.pitfalls.pl);
    expect(onStartLesson).not.toHaveBeenCalled();
    await act(async () => {
      (
        renderer.root.findByType(PrimaryButton).props as { onPress(): void }
      ).onPress();
    });
    expect(onStartLesson).toHaveBeenCalledWith(
      "english-b2",
      "conditionals-and-regrets-b2",
    );
    await act(async () => {
      (
        renderer.root.findAllByType(SmallButton)[0]!.props as {
          onPress(): void;
        }
      ).onPress();
    });
    const a1 = renderer.root.findAll(
      (node) =>
        String(node.type) === "Pressable" &&
        node.findAll(
          (child) =>
            String(child.type) === "Text" && child.props.children === "A1",
        ).length > 0,
    )[0]!;
    await act(async () => {
      (a1.props as { onPress(): void }).onPress();
    });
    expect(JSON.stringify(renderer.toJSON())).toContain(
      "Present Simple: zwyczaje i fakty",
    );
    await act(async () => {
      (
        renderer.root.findByType(SmallButton).props as { onPress(): void }
      ).onPress();
    });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
