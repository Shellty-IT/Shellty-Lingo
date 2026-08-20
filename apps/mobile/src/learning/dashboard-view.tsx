import { Pressable, Text, View } from "react-native";
import type {
  CourseCategory,
  CourseLanguage,
  LearningDashboard,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton } from "./shared";
import { styles } from "./styles";

const categoryOrder: CourseCategory[] = [
  "general",
  "vocabulary",
  "phrases",
  "business",
  "it",
];

const categoryCopy = (category: CourseCategory, copy: TranslationMap): string =>
  ({
    general: copy.categoryGeneral,
    vocabulary: copy.categoryVocabulary,
    phrases: copy.categoryPhrases,
    business: copy.categoryBusiness,
    it: copy.categoryIt,
  })[category];

export function DashboardView({
  dashboard,
  language,
  copy,
  onStartPlacement,
  onOpenReviews,
  onStartLesson,
  onStartC1Exam,
  disabled,
}: {
  dashboard: LearningDashboard;
  language: CourseLanguage;
  copy: TranslationMap;
  onStartPlacement: () => void;
  onOpenReviews: () => void;
  onStartLesson: (courseSlug: string, lessonSlug: string) => void;
  onStartC1Exam: () => void;
  disabled: boolean;
}) {
  return (
    <>
      <View style={styles.courseHeader}>
        <View>
          <Text style={styles.eyebrow}>{copy.lessons}</Text>
          <Text style={styles.title}>
            {language === "en" ? copy.english : copy.thai}
          </Text>
        </View>
        <Text style={styles.level}>
          {copy.levelLabel} {dashboard.level}
        </Text>
      </View>
      <View style={styles.darkCard}>
        <Text style={styles.darkTitle}>
          {dashboard.placementCompleted
            ? copy.retakePlacement
            : copy.placementBadge}
        </Text>
        <Text style={styles.darkBody}>{copy.placementMeta}</Text>
        <PrimaryButton
          label={
            dashboard.placementCompleted
              ? copy.retakePlacement
              : copy.startPlacement
          }
          onPress={onStartPlacement}
          disabled={disabled}
        />
      </View>
      {dashboard.c1ExamAvailable ? (
        <View style={styles.darkCard}>
          <Text style={styles.darkTitle}>{copy.c1ExamTitle}</Text>
          <Text style={styles.darkBody}>{copy.c1ExamDescription}</Text>
          <PrimaryButton
            label={copy.c1ExamStart}
            onPress={onStartC1Exam}
            disabled={disabled}
          />
        </View>
      ) : null}
      {dashboard.c1ExamPassed ? (
        <View style={styles.reviewBanner}>
          <Text style={styles.optionTitle}>{copy.c1ExamPassed}</Text>
        </View>
      ) : null}
      {dashboard.dueReviews > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${copy.reviews}: ${dashboard.dueReviews} ${copy.dueSuffix}`}
          accessibilityState={{ disabled }}
          disabled={disabled}
          style={styles.reviewBanner}
          onPress={onOpenReviews}
        >
          <View>
            <Text style={styles.optionTitle}>{copy.reviews}</Text>
            <Text style={styles.detail}>
              {dashboard.dueReviews} {copy.dueSuffix}
            </Text>
          </View>
          <Text style={styles.reviewCount}>{dashboard.dueReviews}</Text>
        </Pressable>
      ) : null}
      {categoryOrder.flatMap((category) => {
        const courses = dashboard.courses.filter(
          (course) => course.category === category,
        );
        if (courses.length === 0) return [];
        return [
          <View key={`category:${category}`}>
            <Text style={styles.eyebrow}>{categoryCopy(category, copy)}</Text>
          </View>,
          ...courses.flatMap((course) =>
            course.modules.flatMap((module) => [
              <View
                key={`${course.slug}:${module.slug}`}
                style={styles.moduleCard}
              >
                <Text style={styles.moduleTitle}>{module.title}</Text>
                <Text style={styles.darkBody}>
                  {course.level} · {module.lessons.length}{" "}
                  {copy.lessonCountSuffix}
                </Text>
              </View>,
              ...module.lessons.map((item) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${
                    item.status === "completed"
                      ? `${copy.completed}, ${Math.round(item.bestScore * 100)}%`
                      : `${copy.continueLesson}, ${item.estimatedMinutes} ${copy.minutesShort}`
                  }`}
                  accessibilityState={{ disabled }}
                  disabled={disabled}
                  key={`${course.slug}:${item.slug}`}
                  style={[
                    styles.lessonCard,
                    item.status === "in_progress" && styles.lessonCardActive,
                  ]}
                  onPress={() => onStartLesson(course.slug, item.slug)}
                >
                  <View style={styles.lessonIcon}>
                    <Text style={styles.lessonIconText}>
                      {item.status === "completed" ? "✓" : "▶"}
                    </Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.optionTitle}>{item.title}</Text>
                    <Text style={styles.detail}>
                      {item.status === "completed"
                        ? `${copy.completed} · ${Math.round(item.bestScore * 100)}%`
                        : `${copy.continueLesson} · ${item.estimatedMinutes} ${copy.minutesShort}`}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              )),
            ]),
          ),
        ];
      })}
    </>
  );
}
