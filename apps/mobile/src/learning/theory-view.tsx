import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type {
  CourseLanguage,
  InterfaceLocale,
  LearningDashboard,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";
import { theoryLessons, type TheoryLevel } from "./theory-content";

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
  const [selected, setSelected] = useState<string | null>(null);
  const lesson = available.find((item) => item.id === selected);
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

  return (
    <View style={styles.theoryContainer}>
      <SmallButton
        label={lesson ? copy.theoryBackToTopics : copy.backToLessons}
        onPress={() => (lesson ? navigation(null) : onClose())}
      />
      <Text accessibilityRole="header" style={styles.title}>
        {lesson ? lesson.title[locale] : copy.categoryTheory}
      </Text>
      <Text style={styles.detail}>
        {language === "en" ? copy.english : copy.thai}
        {lesson ? ` · ${lesson.level}` : ""}
      </Text>
      {lesson ? (
        <>
          <Text style={styles.theoryBody}>{lesson.introduction[locale]}</Text>
          <View style={styles.theorySection}>
            <Text accessibilityRole="header" style={styles.optionTitle}>
              {copy.theoryRule}
            </Text>
            <Text style={styles.theoryBody}>{lesson.rule[locale]}</Text>
          </View>
          <View style={styles.theoryFormula}>
            <Text accessibilityRole="header" style={styles.optionTitle}>
              {copy.theoryStructure}
            </Text>
            <Text selectable style={styles.theoryBody}>
              {lesson.formula}
            </Text>
          </View>
          <View style={styles.theorySection}>
            <Text accessibilityRole="header" style={styles.optionTitle}>
              {copy.theoryExamples}
            </Text>
            {lesson.examples.map((example) => (
              <View key={example.sentence} style={styles.theoryExample}>
                <Text selectable style={styles.optionTitle}>
                  {example.sentence}
                </Text>
                {example.meaning[locale] !== example.sentence ? (
                  <Text style={styles.theoryBody}>
                    {example.meaning[locale]}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
          <View style={styles.theorySection}>
            <Text accessibilityRole="header" style={styles.optionTitle}>
              {copy.theoryPitfalls}
            </Text>
            <Text style={styles.theoryBody}>{lesson.pitfalls[locale]}</Text>
          </View>
          {practice.length ? (
            <View style={styles.theorySection}>
              <Text accessibilityRole="header" style={styles.optionTitle}>
                {copy.theoryPractice}
              </Text>
              {practice.map((item) => (
                <PrimaryButton
                  key={`${item.courseSlug}:${item.slug}`}
                  label={item.title}
                  disabled={disabled}
                  onPress={() => onStartLesson(item.courseSlug, item.slug)}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.detail}>{copy.theoryPracticeAtLevel}</Text>
          )}
          <SmallButton
            label={copy.theoryBackToTopics}
            onPress={() => navigation(null)}
          />
        </>
      ) : (
        <>
          <Text style={styles.theoryBody}>{copy.theoryDescription}</Text>
          <Text accessibilityRole="header" style={styles.optionTitle}>
            {copy.theoryChooseLevel}
          </Text>
          <View style={styles.theoryLevels}>
            {(["all", ...levels] as const).map((item) => (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected: level === item }}
                onPress={() => setLevel(item)}
                style={[
                  styles.theoryLevel,
                  level === item && styles.theoryLevelSelected,
                ]}
              >
                <Text style={styles.optionTitle}>
                  {item === "all" ? copy.theoryAllLevels : item}
                </Text>
              </Pressable>
            ))}
          </View>
          {available
            .filter((item) => level === "all" || item.level === level)
            .map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title[locale]}, ${item.level}`}
                onPress={() => navigation(item.id)}
                style={styles.lessonCard}
              >
                <View style={styles.flex}>
                  <Text style={styles.optionTitle}>{item.title[locale]}</Text>
                  <Text style={styles.detail}>
                    {item.level} · {copy.theoryRead}
                  </Text>
                  <Text style={styles.theoryBody}>
                    {item.introduction[locale]}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
        </>
      )}
    </View>
  );
}
