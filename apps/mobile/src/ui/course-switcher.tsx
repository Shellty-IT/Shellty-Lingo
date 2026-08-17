import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { CourseLanguage } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";

export function CourseSwitcher({
  language,
  copy,
  disabled = false,
  onChange,
}: {
  language: CourseLanguage;
  copy: TranslationMap;
  disabled?: boolean;
  onChange: (language: CourseLanguage) => void;
}) {
  const courses: Array<[CourseLanguage, string]> = [
    ["en", copy.english],
    ["th", copy.thai],
  ];

  return (
    <View style={styles.root}>
      <Text style={styles.label}>{copy.activeCourse}</Text>
      <View
        accessibilityLabel={copy.switchCourse}
        accessibilityRole="radiogroup"
        style={styles.control}
      >
        {courses.map(([value, label]) => {
          const active = language === value;
          return (
            <Pressable
              key={value}
              accessibilityLabel={`${copy.switchCourse}: ${label}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: active, disabled }}
              disabled={disabled}
              onPress={() => onChange(value)}
              style={({ pressed }) => [
                styles.option,
                active && styles.optionActive,
                pressed && !disabled && styles.optionPressed,
                disabled && styles.optionDisabled,
              ]}
            >
              <Text
                style={[styles.optionText, active && styles.optionTextActive]}
              >
                {value.toUpperCase()} · {label}
              </Text>
            </Pressable>
          );
        })}
        {disabled ? (
          <ActivityIndicator
            accessibilityLabel={copy.switchingCourse}
            color={colors.actionPrimary}
            size="small"
            style={styles.spinner}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing[1] },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  control: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    padding: spacing[1],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
  },
  option: {
    minHeight: 36,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderRadius: radii.pill,
  },
  optionActive: { backgroundColor: colors.actionPrimary },
  optionPressed: { opacity: 0.75 },
  optionDisabled: { opacity: 0.65 },
  optionText: {
    ...typography.title,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  optionTextActive: { color: colors.textInverse },
  spinner: { marginHorizontal: spacing[1] },
});
