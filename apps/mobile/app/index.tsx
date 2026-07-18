import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { getCopy, type Locale, locales } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";
import { apiRequest } from "../src/api";
import {
  logoutSession,
  onSessionCleared,
  readSession,
  saveSession,
  type StoredSession,
} from "../src/session";
import { ProductHome } from "../src/product-home";

type Screen = "welcome" | "auth" | "locale" | "course" | "goal" | "home";
export default function App() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [restoring, setRestoring] = useState(true);
  const [locale, setLocale] = useState<Locale>("pl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState<"en" | "th">("en");
  const [goal, setGoal] = useState("work");
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const copy = useMemo(() => getCopy(locale), [locale]);
  useEffect(() => {
    const unsubscribe = onSessionCleared(() => {
      setSession(null);
      setScreen("auth");
      setAuthMode("login");
    });
    void readSession()
      .then((value) => {
        if (value) {
          setSession(value);
          setLocale(value.user.profile.interfaceLocale);
          setCourse(value.user.profile.activeCourseLanguage ?? "en");
          setScreen(value.user.profile.onboardingCompleted ? "home" : "locale");
        }
      })
      .finally(() => setRestoring(false));
    return unsubscribe;
  }, []);
  const authenticate = async (mode: "login" | "register") => {
    if (!email || password.length < 12 || (mode === "register" && !name)) {
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const next = await apiRequest<StoredSession>(`/auth/${mode}`, {
        method: "POST",
        body: {
          email,
          password,
          ...(mode === "register" ? { displayName: name } : {}),
        },
      });
      await saveSession(next);
      setSession(next);
      setLocale(next.user.profile.interfaceLocale);
      setCourse(next.user.profile.activeCourseLanguage ?? "en");
      setScreen(next.user.profile.onboardingCompleted ? "home" : "locale");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const user = await apiRequest<StoredSession["user"]>("/auth/onboarding", {
        method: "POST",
        token: session.accessToken,
        body: {
          locale,
          language: course,
          goal,
          dailyMinutes,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
      });
      const current = (await readSession()) ?? session;
      const next = { ...current, user };
      await saveSession(next);
      setSession(next);
      setScreen("home");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };
  const button = (label: string, onPress: () => void, secondary = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.buttonSecondaryText,
          locale === "th" && styles.thai,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
  const select = (
    label: string,
    active: boolean,
    onPress: () => void,
    detail?: string,
  ) => (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      accessibilityState={{ checked: active }}
      onPress={onPress}
      style={[styles.option, active && styles.optionActive]}
    >
      <View>
        <Text style={[styles.optionTitle, locale === "th" && styles.thai]}>
          {label}
        </Text>
        {detail ? <Text style={styles.optionDetail}>{detail}</Text> : null}
      </View>
      <Text style={styles.check}>{active ? "✓" : "○"}</Text>
    </Pressable>
  );
  if (restoring)
    return (
      <SafeAreaView style={[styles.safe, styles.loadingScreen]}>
        <ActivityIndicator
          accessibilityLabel={copy.loading}
          color={colors.actionPrimary}
        />
      </SafeAreaView>
    );

  // The home screen owns its own scroll area so ProductHome's tab bar can stay
  // pinned to the bottom instead of scrolling away with the page content.
  if (screen === "home" && session)
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <View style={styles.homeFrame}>
          <ProductHome
            token={session.accessToken}
            locale={locale}
            language={course}
            header={
              <>
                <View style={styles.homeBadge}>
                  <Text style={styles.badgeText}>
                    {course === "en" ? "🇬🇧" : "🇹🇭"}{" "}
                    {course === "en" ? copy.english : copy.thai}
                  </Text>
                </View>
                <Text style={styles.heading}>{copy.homeTitle}</Text>
              </>
            }
            footer={
              <>
                <View style={styles.card}>
                  <Text style={styles.optionTitle}>
                    {session.user.profile.displayName || session.user.email}
                  </Text>
                  <Text style={styles.optionDetail}>{copy.profile}</Text>
                </View>
                {button(copy.signOut, () => void logoutSession(), true)}
              </>
            }
          />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={screen === "welcome" ? "light" : "dark"} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.page,
          screen === "welcome" && styles.welcome,
        ]}
      >
        {screen === "welcome" ? (
          <>
            <View style={styles.logo}>
              <Text style={styles.logoMark}>◈</Text>
              <Text style={styles.brand}>
                Shellty <Text style={styles.brandAccent}>Lingo</Text>
              </Text>
              <Text style={styles.welcomeText}>{copy.welcome}</Text>
            </View>
            {button(copy.start, () => {
              setAuthMode("register");
              setScreen("auth");
            })}
            {button(
              copy.haveAccount,
              () => {
                setAuthMode("login");
                setScreen("auth");
              },
              true,
            )}
          </>
        ) : null}
        {screen === "auth" ? (
          <>
            <Text style={styles.heading}>
              {authMode === "login" ? copy.signIn : copy.createAccount}
            </Text>
            <Text style={styles.body}>{copy.welcome}</Text>
            {authMode === "register" ? (
              <TextInput
                accessibilityLabel={copy.displayName}
                value={name}
                onChangeText={setName}
                placeholder={copy.displayName}
                autoComplete="name"
                style={styles.input}
              />
            ) : null}
            <TextInput
              accessibilityLabel={copy.email}
              value={email}
              onChangeText={setEmail}
              placeholder={copy.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              accessibilityLabel={copy.password}
              value={password}
              onChangeText={setPassword}
              placeholder={copy.password}
              autoComplete={
                authMode === "register" ? "new-password" : "current-password"
              }
              secureTextEntry
              style={styles.input}
            />
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {copy.required}
              </Text>
            ) : null}
            {busy ? (
              <ActivityIndicator />
            ) : (
              <>
                {button(
                  authMode === "login" ? copy.signIn : copy.createAccount,
                  () => void authenticate(authMode),
                )}
                {button(
                  authMode === "login" ? copy.createAccount : copy.haveAccount,
                  () =>
                    setAuthMode((value) =>
                      value === "login" ? "register" : "login",
                    ),
                  true,
                )}
              </>
            )}
          </>
        ) : null}
        {screen === "locale" ? (
          <>
            <Text style={styles.heading}>{copy.appLanguage}</Text>
            {locales.map((item) =>
              select(
                item === "pl" ? "Polski" : item === "en" ? "English" : "ไทย",
                locale === item,
                () => setLocale(item),
              ),
            )}
            {button(copy.continue, () => setScreen("course"))}
          </>
        ) : null}
        {screen === "course" ? (
          <>
            <Text style={styles.heading}>{copy.learnLanguage}</Text>
            {select(
              copy.english,
              course === "en",
              () => setCourse("en"),
              copy.englishDetail,
            )}
            {select(
              copy.thai,
              course === "th",
              () => setCourse("th"),
              copy.thaiDetail,
            )}
            {button(copy.continue, () => setScreen("goal"))}
          </>
        ) : null}
        {screen === "goal" ? (
          <>
            <Text style={styles.heading}>{copy.goal}</Text>
            {["work", "travel", "conversation", "exam"].map((item) =>
              select(
                copy[item as "work" | "travel" | "conversation" | "exam"],
                goal === item,
                () => setGoal(item),
              ),
            )}
            <Text style={styles.label}>{copy.dailyTime}</Text>
            <View style={styles.minuteGrid}>
              {[5, 10, 15, 30].map((minutes) =>
                select(`${minutes} min`, dailyMinutes === minutes, () =>
                  setDailyMinutes(minutes),
                ),
              )}
            </View>
            {busy ? (
              <ActivityIndicator />
            ) : (
              button(copy.finish, () => void finish())
            )}
            {error ? <Text style={styles.error}>{copy.authError}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  loadingScreen: { alignItems: "center", justifyContent: "center" },
  page: {
    flexGrow: 1,
    padding: spacing[6],
    gap: spacing[3],
    backgroundColor: colors.backgroundApp,
  },
  homeFrame: {
    flex: 1,
    padding: spacing[6],
    backgroundColor: colors.backgroundApp,
  },
  welcome: {
    backgroundColor: colors.backgroundInverse,
    justifyContent: "flex-end",
    paddingBottom: spacing[8],
  },
  logo: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoMark: { color: colors.accentSky, fontSize: 82 },
  brand: { ...typography.display, color: colors.textInverse },
  brandAccent: { color: colors.accentSky },
  welcomeText: {
    ...typography.body,
    color: colors.textOnInverseMuted,
    marginTop: spacing[3],
    textAlign: "center",
  },
  heading: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing[4],
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing[3],
  },
  input: {
    minHeight: 52,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: spacing[4],
    ...typography.body,
    color: colors.textPrimary,
  },
  button: {
    minHeight: 54,
    borderRadius: radii.lg,
    backgroundColor: colors.actionPrimary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  buttonText: { ...typography.title, color: colors.textInverse },
  buttonSecondaryText: { color: colors.actionPrimary },
  option: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.lg,
    padding: spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.backgroundCard,
  },
  optionActive: {
    borderColor: colors.actionPrimary,
    borderWidth: 2,
    backgroundColor: colors.surfaceBlue,
  },
  optionTitle: { ...typography.title, color: colors.textPrimary },
  optionDetail: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  check: { color: colors.actionPrimary, fontSize: 22 },
  label: {
    ...typography.title,
    color: colors.textPrimary,
    marginTop: spacing[2],
  },
  minuteGrid: { gap: spacing[2] },
  error: { ...typography.body, color: colors.error, fontSize: 13 },
  pressed: { opacity: 0.8 },
  thai: { fontFamily: typography.thai.fontFamily },
  homeBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceTeal,
  },
  badgeText: { ...typography.title, color: colors.success, fontSize: 14 },
  card: {
    marginVertical: spacing[4],
    padding: spacing[5],
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
});
