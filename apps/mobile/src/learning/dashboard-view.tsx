import { Pressable, Text, View } from "react-native";
import type { CourseLanguage, LearningDashboard } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { PrimaryButton } from "./shared";
import { styles } from "./styles";

export function DashboardView({
  dashboard,
  language,
  copy,
  onStartPlacement,
  onOpenReviews,
  onStartLesson,
}: {
  dashboard: LearningDashboard;
  language: CourseLanguage;
  copy: TranslationMap;
  onStartPlacement: () => void;
  onOpenReviews: () => void;
  onStartLesson: (courseSlug: string, lessonSlug: string) => void;
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
      {!dashboard.placementCompleted ? (
        <View style={styles.darkCard}>
          <Text style={styles.darkTitle}>{copy.placementBadge}</Text>
          <Text style={styles.darkBody}>{copy.placementMeta}</Text>
          <PrimaryButton
            label={copy.startPlacement}
            onPress={onStartPlacement}
          />
        </View>
      ) : null}
      {dashboard.dueReviews > 0 ? (
        <Pressable style={styles.reviewBanner} onPress={onOpenReviews}>
          <View>
            <Text style={styles.optionTitle}>{copy.reviews}</Text>
            <Text style={styles.detail}>
              {dashboard.dueReviews} {copy.dueSuffix}
            </Text>
          </View>
          <Text style={styles.reviewCount}>{dashboard.dueReviews}</Text>
        </Pressable>
      ) : null}
      {dashboard.courses.flatMap((course) =>
        course.modules.flatMap((module) => [
          <View key={`${course.slug}:${module.slug}`} style={styles.moduleCard}>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.darkBody}>
              {module.lessons.length} {copy.lessonCountSuffix}
            </Text>
          </View>,
          ...module.lessons.map((item) => (
            <Pressable
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
                    : `${copy.continueLesson} · ${item.estimatedMinutes} min`}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )),
        ]),
      )}
    </>
  );
}
