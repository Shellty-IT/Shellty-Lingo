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
import {
  clearSession,
  readSession,
  saveSession,
  type StoredSession,
} from "../src/session";

type Screen = "welcome" | "auth" | "locale" | "course" | "goal" | "home";
const api = () => process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/v1";
const request = async <T,>(
  path: string,
  body: unknown,
  token?: string,
): Promise<T> => {
  const result = await fetch(`${api()}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!result.ok) throw new Error("request failed");
  return result.json() as Promise<T>;
};

export default function App() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [locale, setLocale] = useState<Locale>("pl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState<"en" | "th">("en");
  const [goal, setGoal] = useState("work");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const copy = useMemo(() => getCopy(locale), [locale]);
  useEffect(() => {
    void readSession().then((value) => {
      if (value) {
        setSession(value);
        setLocale(value.user.profile.interfaceLocale);
        setScreen(value.user.profile.onboardingCompleted ? "home" : "locale");
      }
    });
  }, []);
  const authenticate = async (mode: "login" | "register") => {
    if (!email || password.length < 12 || (mode === "register" && !name)) {
      setError(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const next = await request<StoredSession>(`/auth/${mode}`, {
        email,
        password,
        displayName: name,
      });
      await saveSession(next);
      setSession(next);
      setLocale(next.user.profile.interfaceLocale);
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
      const user = await request<StoredSession["user"]>(
        "/auth/onboarding",
        { locale, language: course, goal, dailyMinutes: 15 },
        session.accessToken,
      );
      const next = { ...session, user };
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
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={screen === "welcome" ? "light" : "dark"} />
      <ScrollView
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
            {button(copy.start, () => setScreen("locale"))}
            {button(copy.haveAccount, () => setScreen("auth"), true)}
          </>
        ) : null}
        {screen === "auth" ? (
          <>
            <Text style={styles.heading}>{copy.signIn}</Text>
            <Text style={styles.body}>{copy.welcome}</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={copy.displayName}
              style={styles.input}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={copy.email}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={copy.password}
              secureTextEntry
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{copy.required}</Text> : null}
            {busy ? (
              <ActivityIndicator />
            ) : (
              <>
                {button(copy.signIn, () => void authenticate("login"))}
                {button(
                  copy.createAccount,
                  () => void authenticate("register"),
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
              "Globalny · praktyczny",
            )}
            {select(
              copy.thai,
              course === "th",
              () => setCourse("th"),
              "Alfabet · tony · wymowa",
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
            {select("15 min", true, () => undefined)}
            {busy ? (
              <ActivityIndicator />
            ) : (
              button(copy.finish, () => void finish())
            )}
            {error ? <Text style={styles.error}>{copy.authError}</Text> : null}
          </>
        ) : null}
        {screen === "home" ? (
          <>
            <View style={styles.homeBadge}>
              <Text style={styles.badgeText}>
                {course === "en" ? "🇬🇧" : "🇹🇭"}{" "}
                {course === "en" ? copy.english : copy.thai}
              </Text>
            </View>
            <Text style={styles.heading}>{copy.homeTitle}</Text>
            <Text style={styles.body}>{copy.homeBody}</Text>
            <View style={styles.card}>
              <Text style={styles.optionTitle}>
                {session?.user.profile.displayName || session?.user.email}
              </Text>
              <Text style={styles.optionDetail}>{copy.profile}</Text>
            </View>
            {button(
              copy.signOut,
              () =>
                void clearSession().then(() => {
                  setSession(null);
                  setScreen("welcome");
                }),
              true,
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundApp },
  page: {
    flexGrow: 1,
    padding: spacing[6],
    gap: spacing[3],
    backgroundColor: colors.backgroundApp,
  },
  welcome: {
    backgroundColor: colors.backgroundInverse,
    justifyContent: "flex-end",
    paddingBottom: spacing[8],
  },
  logo: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoMark: { color: "#5FA6FF", fontSize: 82 },
  brand: { ...typography.display, color: colors.textInverse },
  brandAccent: { color: "#5FA6FF" },
  welcomeText: {
    ...typography.body,
    color: "#B9D4FF",
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
    backgroundColor: "#F4F8FF",
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
  error: { ...typography.body, color: colors.error, fontSize: 13 },
  pressed: { opacity: 0.8 },
  thai: { fontFamily: typography.thai.fontFamily },
  homeBadge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: "#E8F7F4",
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
