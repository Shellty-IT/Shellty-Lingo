import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { HealthResponse } from "@shellty/api-contracts";
import { CORRELATION_ID_HEADER } from "@shellty/api-contracts";
import { getCopy, type Locale, locales } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

type ConnectionState = "idle" | "loading" | "online" | "offline";

const localeNames: Record<Locale, string> = { pl: "PL", en: "EN", th: "ไทย" };

function defaultApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  return Platform.OS === "android"
    ? "http://10.0.2.2:3001/v1"
    : "http://localhost:3001/v1";
}

export default function FoundationScreen() {
  const [locale, setLocale] = useState<Locale>("pl");
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [correlationId, setCorrelationId] = useState<string>();
  const copy = useMemo(() => getCopy(locale), [locale]);

  async function checkApi(): Promise<void> {
    setConnection("loading");
    try {
      const response = await fetch(`${defaultApiUrl()}/health/live`);
      const body = (await response.json()) as HealthResponse;
      if (!response.ok || body.status !== "ok")
        throw new Error("Unhealthy API");
      setCorrelationId(
        response.headers.get(CORRELATION_ID_HEADER) ?? body.correlationId,
      );
      setConnection("online");
    } catch {
      setCorrelationId(undefined);
      setConnection("offline");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.page}
        alwaysBounceVertical={false}
        accessibilityRole="summary"
      >
        <View style={styles.brand} accessibilityLabel="Shellty Lingo">
          <View
            style={styles.mark}
            importantForAccessibility="no-hide-descendants"
          >
            <View style={[styles.markLine, styles.markLineBlue]} />
            <View style={[styles.markLine, styles.markLineTeal]} />
          </View>
          <Text style={styles.brandName}>Shellty Lingo</Text>
          <Text style={styles.tagline}>Ucz się. Rozmawiaj. Rób postępy.</Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.eyebrow, locale === "th" && styles.thai]}>
            {copy.greeting}
          </Text>
          <Text style={[styles.title, locale === "th" && styles.thai]}>
            {copy.foundationTitle}
          </Text>
          <Text style={[styles.body, locale === "th" && styles.thai]}>
            {copy.foundationBody}
          </Text>

          <Text style={[styles.localeLabel, locale === "th" && styles.thai]}>
            {copy.localeLabel}
          </Text>
          <View style={styles.localeSwitch} accessibilityRole="radiogroup">
            {locales.map((item) => {
              const selected = item === locale;
              return (
                <Pressable
                  key={item}
                  onPress={() => setLocale(item)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.localeButton,
                    selected && styles.localeButtonSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.localeText,
                      selected && styles.localeTextSelected,
                    ]}
                  >
                    {localeNames[item]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => void checkApi()}
            disabled={connection === "loading"}
            accessibilityRole="button"
            accessibilityState={{ busy: connection === "loading" }}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            {connection === "loading" ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={[styles.buttonText, locale === "th" && styles.thai]}>
                {copy.action}
              </Text>
            )}
          </Pressable>

          {connection !== "idle" && connection !== "loading" ? (
            <View
              style={[
                styles.status,
                connection === "online" ? styles.success : styles.error,
              ]}
              accessibilityLiveRegion="polite"
            >
              <Text style={[styles.statusText, locale === "th" && styles.thai]}>
                {connection === "online" ? copy.apiOnline : copy.apiOffline}
              </Text>
              {correlationId ? (
                <Text style={styles.correlation}>ID {correlationId}</Text>
              ) : null}
            </View>
          ) : null}
        </View>

        <Text style={styles.footer}>Foundation Release · Stage 2</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundInverse },
  page: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[7],
    backgroundColor: colors.backgroundInverse,
  },
  brand: { alignItems: "center", marginBottom: spacing[7] },
  mark: {
    width: 72,
    height: 58,
    marginBottom: spacing[3],
    alignItems: "center",
  },
  markLine: {
    width: 44,
    height: 24,
    borderWidth: 4,
    borderTopWidth: 0,
    borderRadius: 5,
    transform: [{ rotate: "30deg" }],
    position: "absolute",
  },
  markLineBlue: { borderColor: colors.actionPrimary, top: 1 },
  markLineTeal: {
    borderColor: colors.actionSupport,
    top: 24,
    transform: [{ rotate: "-30deg" }],
  },
  brandName: {
    ...typography.display,
    color: colors.textInverse,
    textAlign: "center",
  },
  tagline: {
    ...typography.body,
    color: "#B8C7DB",
    textAlign: "center",
    marginTop: spacing[2],
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.xl,
    padding: spacing[6],
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  eyebrow: {
    ...typography.title,
    color: colors.actionSupport,
    marginBottom: spacing[2],
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing[3],
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing[6],
  },
  thai: {
    fontFamily: typography.thai.fontFamily,
    lineHeight: typography.thai.lineHeight,
  },
  localeLabel: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing[2],
  },
  localeSwitch: {
    flexDirection: "row",
    padding: spacing[1],
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundApp,
    marginBottom: spacing[5],
    gap: spacing[1],
  },
  localeButton: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
  },
  localeButtonSelected: { backgroundColor: colors.backgroundCard },
  localeText: { ...typography.title, color: colors.textSecondary },
  localeTextSelected: { color: colors.actionPrimary },
  primaryButton: {
    minHeight: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  buttonText: {
    ...typography.title,
    color: colors.textInverse,
    textAlign: "center",
  },
  pressed: { opacity: 0.82 },
  status: {
    marginTop: spacing[4],
    borderRadius: radii.md,
    padding: spacing[3],
    borderWidth: 1,
  },
  success: { backgroundColor: "#E8F7F4", borderColor: "#BEE9E1" },
  error: { backgroundColor: "#FDF1F1", borderColor: "#F4C9C9" },
  statusText: { ...typography.body, color: colors.textPrimary },
  correlation: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: spacing[1],
  },
  footer: {
    color: "#9FB5D3",
    fontSize: 12,
    textAlign: "center",
    marginTop: spacing[5],
  },
});
