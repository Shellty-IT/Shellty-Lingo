import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radii, spacing, typography } from "@shellty/ui";

type StateKind = "loading" | "empty" | "error" | "success";

const glyphs: Record<Exclude<StateKind, "loading">, string> = {
  empty: "○",
  error: "!",
  success: "✓",
};

export function StatePanel({
  kind,
  title,
  body,
  actionLabel,
  onAction,
}: {
  kind: StateKind;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      accessibilityRole={kind === "error" ? "alert" : "summary"}
      style={[styles.root, styles[kind]]}
    >
      {kind === "loading" ? (
        <ActivityIndicator
          accessibilityLabel={title}
          color={colors.actionPrimary}
          size="large"
        />
      ) : (
        <View style={[styles.glyph, styles[`${kind}Glyph`]]} accessible={false}>
          <Text style={[styles.glyphText, styles[`${kind}GlyphText`]]}>
            {glyphs[kind]}
          </Text>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => [
            styles.action,
            pressed && styles.actionPressed,
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[7],
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundCard,
  },
  loading: { backgroundColor: colors.surfaceBlue },
  empty: { backgroundColor: colors.backgroundCard },
  error: {
    borderColor: colors.borderRose,
    backgroundColor: colors.surfaceRoseDeep,
  },
  success: {
    borderColor: colors.actionSupport,
    backgroundColor: colors.surfaceTeal,
  },
  glyph: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
  },
  emptyGlyph: { backgroundColor: colors.surfaceBlue },
  errorGlyph: { backgroundColor: colors.surfaceRose },
  successGlyph: { backgroundColor: colors.actionSupport },
  glyphText: { ...typography.heading },
  emptyGlyphText: { color: colors.actionPrimary },
  errorGlyphText: { color: colors.error },
  successGlyphText: { color: colors.textInverse },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    textAlign: "center",
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  action: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.actionPrimary,
  },
  actionPressed: { opacity: 0.8 },
  actionText: {
    ...typography.title,
    color: colors.textInverse,
    textAlign: "center",
  },
});
