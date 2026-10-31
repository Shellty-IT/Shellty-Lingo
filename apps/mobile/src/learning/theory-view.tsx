import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type {
  CourseLanguage,
  InterfaceLocale,
  LearningDashboard,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";
import { PrimaryButton, SmallButton } from "./shared";
import {
  theoryCategories,
  theoryLessons,
  type TheoryCategory,
  type TheoryLevel,
} from "./theory-content";
import { categoryTones, theoryStyles as s, theoryTones } from "./theory-styles";

type ReadingTone = "knowledge" | "structure" | "examples" | "pitfalls";

function ReadingSection({
  tone,
  label,
  title,
  children,
}: {
  tone: ReadingTone;
  label: string;
  title: string;
  children: ReactNode;
}) {
  const color = theoryTones[tone];
  return (
    <View
      style={[
        s.section,
        { backgroundColor: color.surface, borderColor: color.border },
      ]}
    >
      <View style={s.header}>
        <Text style={[s.sectionLabel, { color: color.ink }]}>{label}</Text>
        <Text accessibilityRole="header" style={s.heading}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .toLowerCase();

export function TheoryView({
  language,
  locale,
  copy,
  dashboard,
  onClose,
  onStartLesson,
  onTopicChange,
  disabled,
}: {
  language: CourseLanguage;
  locale: InterfaceLocale;
  copy: TranslationMap;
  dashboard: LearningDashboard;
  onClose: () => void;
  onStartLesson: (courseSlug: string, lessonSlug: string) => void;
  onTopicChange?: () => void;
  disabled: boolean;
}) {
  const available = theoryLessons.filter(
    (lesson) => lesson.language === language,
  );
  const levels = (["A1", "A2", "B1", "B2", "C1"] as const).filter((level) =>
    available.some((lesson) => lesson.level === level),
  );
  const [level, setLevel] = useState<TheoryLevel | "all">(
    levels.find((item) => item === dashboard.level) ?? "all",
  );
  const [category, setCategory] = useState<TheoryCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const lesson = available.find((item) => item.id === selected);
  const lessonCategory = theoryCategories.find(
    (item) => item.id === lesson?.category,
  );
  const search = normalizeSearch(query.trim());
  const matched = available.filter((item) => {
    const topic = theoryCategories.find((entry) => entry.id === item.category)!;
    return (
      (level === "all" || item.level === level) &&
      (!search ||
        normalizeSearch(
          [
            item.title[locale],
            item.title.en,
            item.introduction[locale],
            item.formula,
            topic.title[locale],
          ].join(" "),
        ).includes(search))
    );
  });
  const visible = matched.filter(
    (item) => category === "all" || item.category === category,
  );
  const categories = theoryCategories.filter((topic) =>
    available.some((item) => item.category === topic.id),
  );
  const practice = lesson
    ? dashboard.courses.flatMap((course) =>
        course.modules.flatMap((module) =>
          module.lessons
            .filter((item) => lesson.practiceSlugs.includes(item.slug))
            .map((item) => ({ courseSlug: course.slug, ...item })),
        ),
      )
    : [];
  const navigation = (next: string | null) => {
    setSelected(next);
    onTopicChange?.();
  };
  const resetFilters = () => {
    setLevel("all");
    setCategory("all");
    setQuery("");
  };
  const legend: Array<{ tone: ReadingTone; label: string }> = [
    { tone: "knowledge", label: copy.theoryKnowledgeLabel },
    { tone: "structure", label: copy.theoryStructureLabel },
    { tone: "examples", label: copy.theoryExamplesLabel },
    { tone: "pitfalls", label: copy.theoryPitfallsLabel },
  ];

  return (
    <View style={s.container}>
      <View style={s.back}>
        <SmallButton
          label={lesson ? copy.theoryBackToTopics : copy.backToLessons}
          onPress={() => (lesson ? navigation(null) : onClose())}
        />
      </View>
      <View style={s.header}>
        <View style={s.row}>
          <Text style={s.label}>
            {language === "en" ? copy.english : copy.thai}
          </Text>
          {lesson && lessonCategory ? (
            <View
              style={[
                s.badge,
                { backgroundColor: categoryTones[lesson.category].surface },
              ]}
            >
              <Text
                style={[
                  s.badgeText,
                  { color: categoryTones[lesson.category].ink },
                ]}
              >
                {lesson.level} · {lessonCategory.title[locale]}
              </Text>
            </View>
          ) : null}
        </View>
        <Text accessibilityRole="header" style={s.title}>
          {lesson ? lesson.title[locale] : copy.categoryTheory}
        </Text>
        <Text style={s.subtitle}>
          {lesson ? lesson.introduction[locale] : copy.theoryDescription}
        </Text>
      </View>
      {lesson ? (
        <>
          <View style={s.header}>
            <Text style={s.guide}>{copy.theoryLessonGuide}</Text>
            <View style={s.legend}>
              {legend.map(({ tone, label }) => (
                <View
                  key={tone}
                  style={[
                    s.legendItem,
                    {
                      backgroundColor: theoryTones[tone].surface,
                      borderColor: theoryTones[tone].border,
                    },
                  ]}
                >
                  <Text
                    style={[s.legendText, { color: theoryTones[tone].ink }]}
                  >
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <ReadingSection
            tone="knowledge"
            label={`01 · ${copy.theoryKnowledgeLabel}`}
            title={copy.theoryRule}
          >
            <Text selectable style={s.body}>
              {lesson.rule[locale]}
            </Text>
          </ReadingSection>
          <ReadingSection
            tone="structure"
            label={`02 · ${copy.theoryStructureLabel}`}
            title={copy.theoryStructure}
          >
            {lesson.formula.split("\n").map((line, index) => (
              <View key={`${index}:${line}`} style={s.formulaRow}>
                <Text selectable style={s.formula}>
                  {line}
                </Text>
              </View>
            ))}
          </ReadingSection>
          <ReadingSection
            tone="examples"
            label={`03 · ${copy.theoryExamplesLabel}`}
            title={copy.theoryExamples}
          >
            {lesson.examples.map((example) => (
              <View key={example.sentence} style={s.example}>
                <Text selectable style={s.sentence}>
                  {example.sentence}
                </Text>
                {example.meaning[locale] !== example.sentence ? (
                  <View style={s.header}>
                    <Text style={s.label}>{copy.theoryTranslation}</Text>
                    <Text selectable style={s.translation}>
                      {example.meaning[locale]}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ReadingSection>
          <ReadingSection
            tone="pitfalls"
            label={`04 · ${copy.theoryPitfallsLabel}`}
            title={copy.theoryPitfalls}
          >
            <Text selectable style={s.body}>
              {lesson.pitfalls[locale]}
            </Text>
          </ReadingSection>
          <View style={s.practice}>
            <Text accessibilityRole="header" style={s.heading}>
              {copy.theoryPractice}
            </Text>
            {practice.length ? (
              practice.map((item) => (
                <PrimaryButton
                  key={`${item.courseSlug}:${item.slug}`}
                  label={item.title}
                  disabled={disabled}
                  onPress={() => onStartLesson(item.courseSlug, item.slug)}
                />
              ))
            ) : (
              <Text style={s.subtitle}>{copy.theoryPracticeAtLevel}</Text>
            )}
          </View>
          <SmallButton
            label={copy.theoryBackToTopics}
            onPress={() => navigation(null)}
          />
        </>
      ) : (
        <>
          <View style={s.filters}>
            <TextInput
              accessibilityLabel={copy.theorySearch}
              placeholder={copy.theorySearchPlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              autoCorrect={false}
              returnKeyType="search"
              style={[s.search, searchFocused && s.searchFocused]}
            />
            <View style={s.filterRow}>
              <Text accessibilityRole="header" style={s.label}>
                {copy.theoryChooseLevelShort}
              </Text>
              <View style={s.row}>
                {(["all", ...levels] as const).map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={
                      item === "all"
                        ? copy.theoryAllLevels
                        : `${copy.theoryChooseLevelShort} ${item}`
                    }
                    accessibilityState={{ selected: level === item }}
                    onPress={() => setLevel(item)}
                    style={({ pressed }) => [
                      s.chip,
                      level === item && s.chipSelected,
                      pressed && s.pressed,
                    ]}
                  >
                    <Text
                      style={[s.chipText, level === item && s.chipTextSelected]}
                    >
                      {item === "all" ? copy.theoryAllLevels : item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={s.filterRow}>
              <Text accessibilityRole="header" style={s.label}>
                {copy.theoryChooseCategory}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator
                contentContainerStyle={s.chips}
                keyboardShouldPersistTaps="handled"
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: category === "all" }}
                  onPress={() => setCategory("all")}
                  style={({ pressed }) => [
                    s.chip,
                    category === "all" && s.chipSelected,
                    pressed && s.pressed,
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      category === "all" && s.chipTextSelected,
                    ]}
                  >
                    {copy.theoryAllCategories}
                  </Text>
                </Pressable>
                {categories.map((topic) => {
                  const tone = categoryTones[topic.id];
                  const count = matched.filter(
                    (item) => item.category === topic.id,
                  ).length;
                  if (count === 0 && category !== topic.id) return null;
                  return (
                    <Pressable
                      key={topic.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${topic.title[locale]}, ${copy.theoryResults}: ${count}`}
                      accessibilityState={{ selected: category === topic.id }}
                      onPress={() => setCategory(topic.id)}
                      style={({ pressed }) => [
                        s.chip,
                        {
                          borderColor: tone.border,
                          backgroundColor: tone.surface,
                        },
                        category === topic.id && {
                          borderColor: tone.ink,
                          borderWidth: 2,
                        },
                        pressed && s.pressed,
                      ]}
                    >
                      <Text style={[s.chipText, { color: tone.ink }]}>
                        {topic.title[locale]} · {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
          <Text accessibilityLiveRegion="polite" style={s.label}>
            {copy.theoryResults}: {visible.length}
          </Text>
          {visible.length ? (
            <View style={s.results}>
              {categories.map((topic) => {
                const items = visible.filter(
                  (item) => item.category === topic.id,
                );
                if (!items.length) return null;
                const tone = categoryTones[topic.id];
                return (
                  <View key={topic.id} style={s.group}>
                    <View style={s.groupHeading}>
                      <View
                        style={[s.groupMarker, { backgroundColor: tone.ink }]}
                      />
                      <View style={s.flex}>
                        <Text accessibilityRole="header" style={s.heading}>
                          {topic.title[locale]}
                        </Text>
                        <Text style={s.subtitle}>
                          {topic.description[locale]}
                        </Text>
                      </View>
                      <Text style={s.count}>{items.length}</Text>
                    </View>
                    {items.map((item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.title[locale]}, ${item.level}`}
                        onPress={() => navigation(item.id)}
                        style={({ pressed }) => [
                          s.topic,
                          { borderColor: tone.border },
                          pressed && s.pressed,
                        ]}
                      >
                        <View style={s.topicContent}>
                          <Text style={s.topicTitle}>{item.title[locale]}</Text>
                          <View style={s.row}>
                            <View
                              style={[
                                s.badge,
                                { backgroundColor: tone.surface },
                              ]}
                            >
                              <Text style={[s.badgeText, { color: tone.ink }]}>
                                {item.level}
                              </Text>
                            </View>
                            <Text style={s.label}>{copy.theoryRead}</Text>
                          </View>
                        </View>
                        <Text style={s.chevron} accessible={false}>
                          ›
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={s.empty}>
              <Text accessibilityRole="header" style={s.heading}>
                {copy.theoryNoResults}
              </Text>
              <Text style={s.subtitle}>{copy.theoryNoResultsHint}</Text>
              <SmallButton
                label={copy.theoryResetFilters}
                onPress={resetFilters}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}
