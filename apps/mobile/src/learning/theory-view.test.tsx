/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { TextInput } from "react-native";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCopy } from "@shellty/i18n";
import type { LearningDashboard } from "@shellty/api-contracts";
vi.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  ScrollView: "ScrollView",
  TextInput: "TextInput",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (styles: unknown) => styles },
}));
import { TheoryView } from "./theory-view";
import { theoryCategories, theoryLessons } from "./theory-content";
import { PrimaryButton, SmallButton } from "./shared";

describe("theory reading flow", () => {
  let renderer: ReactTestRenderer;
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
  });
  const press = async (label: string) => {
    const button = renderer.root.findAll(
      (node) =>
        String(node.type) === "Pressable" &&
        node.props.accessibilityLabel === label,
    )[0]!;
    await act(async () => (button.props as { onPress(): void }).onPress());
  };
  const search = async (value: string) => {
    await act(async () => {
      (
        renderer.root.findByType(TextInput).props as {
          onChangeText(value: string): void;
        }
      ).onChangeText(value);
    });
  };
  it("combines category, level and accent-insensitive search, preserves filters on return and recovers from no results", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const onTopicChange = vi.fn();
    const copy = getCopy("pl");
    await act(async () => {
      renderer = create(
        createElement(TheoryView, {
          language: "en",
          locale: "pl",
          copy,
          dashboard: {
            level: "A2",
            courses: [],
          } as unknown as LearningDashboard,
          onClose: vi.fn(),
          onStartLesson: vi.fn(),
          onTopicChange,
          disabled: false,
        }),
      );
    });
    const tenses = theoryCategories.find((item) => item.id === "tenses")!;
    await press(`${tenses.title.pl}, ${copy.theoryResults}: 3`);
    await search("  PRZESZLOSC ");
    expect(JSON.stringify(renderer.toJSON())).toContain(
      "Past Simple: zakończona przeszłość",
    );
    expect(JSON.stringify(renderer.toJSON())).not.toContain(
      "Present Continuous: co dzieje się teraz",
    );
    await press("Past Simple: zakończona przeszłość, A2");
    expect(JSON.stringify(renderer.toJSON())).toContain("01 · Zasada");
    expect(JSON.stringify(renderer.toJSON())).toContain("03 · Przykłady");
    expect(onTopicChange).toHaveBeenCalledOnce();
    await press(copy.theoryBackToTopics);
    expect(renderer.root.findByType(TextInput).props.value).toBe(
      "  PRZESZLOSC ",
    );
    await press("Poziom A1");
    expect(JSON.stringify(renderer.toJSON())).toContain(copy.theoryNoResults);
    await press(copy.theoryResetFilters);
    expect(renderer.root.findByType(TextInput).props.value).toBe("");
    for (const lesson of theoryLessons.filter((item) => item.language === "en"))
      expect(JSON.stringify(renderer.toJSON())).toContain(lesson.title.pl);
  });
  it.each(["pl", "en", "th"] as const)(
    "keeps the Thai course separate and translated in %s",
    async (locale) => {
      Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
      const copy = getCopy(locale);
      await act(async () => {
        renderer = create(
          createElement(TheoryView, {
            language: "th",
            locale,
            copy,
            dashboard: {
              level: "A1",
              courses: [],
            } as unknown as LearningDashboard,
            onClose: vi.fn(),
            onStartLesson: vi.fn(),
            disabled: false,
          }),
        );
      });
      await press(copy.theoryAllLevels);
      for (const lesson of theoryLessons.filter(
        (item) => item.language === "th",
      ))
        expect(JSON.stringify(renderer.toJSON())).toContain(
          lesson.title[locale],
        );
      expect(JSON.stringify(renderer.toJSON())).not.toContain("Present Simple");
      await search("ไม่มี");
      const topic = theoryLessons.find((item) => item.id === "th-linking")!;
      await press(`${topic.title[locale]}, B1`);
      expect(JSON.stringify(renderer.toJSON())).toContain(topic.rule[locale]);
      expect(JSON.stringify(renderer.toJSON())).toContain(
        copy.theoryPracticeAtLevel,
      );
    },
  );
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
