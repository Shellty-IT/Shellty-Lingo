import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { getLocales as getDeviceLocales } from "expo-localization";
import {
  getCopy,
  type Locale,
  type TranslationMap,
  locales,
} from "@shellty/i18n";
import type { CourseLanguage } from "@shellty/api-contracts";
import { colors, radii, spacing, typography } from "@shellty/ui";
import logoImage from "../assets/logo.png";
import { ApiRequestError, apiRequest } from "../src/api";
import {
  logoutSession,
  onSessionCleared,
  readSession,
  saveSession,
  type StoredSession,
} from "../src/session";
import { ProductHome } from "../src/product-home";
import { sendTelemetry } from "../src/queries/release";

type Screen = "welcome" | "auth" | "locale" | "course" | "goal" | "home";
type FieldErrors = { name?: string; email?: string; password?: string };

// Deliberately permissive: the server owns the real rule, this only catches the
// obvious typo before the user waits for a round trip.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// §19 — an error has to say what to fix, so map the stable API codes onto their
// own messages instead of showing one catch-all string for every failure.
const authErrorMessage = (error: unknown, copy: TranslationMap): string => {
  if (!(error instanceof ApiRequestError)) return copy.networkError;
  if (error.code === "INVALID_CREDENTIALS") return copy.invalidCredentials;
  if (error.code === "EMAIL_ALREADY_REGISTERED") return copy.emailAlreadyUsed;
  if (error.status === 429) return copy.tooManyAttempts;
  if (error.status >= 500 || error.status === 0) return copy.networkError;
  return copy.authError;
};

// One labelled row: the label stays visible while typing, and the hint slot is
// reused by the error so the field never changes height.
function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {error ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [screen, setScreen] = useState<Screen>("welcome");
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [restoring, setRestoring] = useState(true);
  const [locale, setLocale] = useState<Locale>(() => {
    const deviceLocale = getDeviceLocales()[0]?.languageCode;
    return locales.find((candidate) => candidate === deviceLocale) ?? "en";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [course, setCourse] = useState<"en" | "th">("en");
  const [goal, setGoal] = useState("work");
  const [dailyMinutes, setDailyMinutes] = useState(15);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
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
  const switchAuthMode = (mode: "login" | "register") => {
    setAuthMode(mode);
    setFieldErrors({});
    setFormError(null);
    setShowPassword(false);
  };
  const authenticate = async (mode: "login" | "register") => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    // Register mirrors registerRequestSchema; login only checks that something
    // was typed, because repeating the length rule there would reject a valid
    // older password and leak the policy to anyone probing the form.
    const nextErrors: FieldErrors = {
      ...(mode === "register" && !trimmedName
        ? { name: copy.displayNameRequired }
        : {}),
      ...(emailPattern.test(trimmedEmail) ? {} : { email: copy.emailInvalid }),
      ...(!password
        ? { password: copy.passwordRequired }
        : mode === "register" && password.length < 8
          ? { password: copy.passwordTooShort }
          : {}),
    };
    setFieldErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;
    setBusy(true);
    try {
      const next = await apiRequest<StoredSession>(`/auth/${mode}`, {
        method: "POST",
        body: {
          email: trimmedEmail,
          password,
          ...(mode === "register" ? { displayName: trimmedName } : {}),
        },
      });
      await saveSession(next);
      setSession(next);
      setLocale(next.user.profile.interfaceLocale);
      setCourse(next.user.profile.activeCourseLanguage ?? "en");
      setScreen(next.user.profile.onboardingCompleted ? "home" : "locale");
      if (mode === "register")
        sendTelemetry(next.accessToken, "onboarding_started", {
          locale: next.user.profile.interfaceLocale,
        });
    } catch (cause) {
      setFormError(authErrorMessage(cause, copy));
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    if (!session) return;
    setBusy(true);
    setFormError(null);
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
      sendTelemetry(next.accessToken, "onboarding_completed", {
        language: course,
        locale,
        dailyMinutes,
        goal,
      });
      setScreen("home");
    } catch (cause) {
      setFormError(authErrorMessage(cause, copy));
    } finally {
      setBusy(false);
    }
  };
  const changeCourse = async (language: CourseLanguage) => {
    if (!session || language === course) return;
    const previousLanguage = course;
    const user = await apiRequest<StoredSession["user"]>(
      "/auth/me/active-course",
      {
        method: "PATCH",
        token: session.accessToken,
        body: {
          language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        },
      },
    );
    const current = (await readSession()) ?? session;
    const next = { ...current, user };
    await saveSession(next);
    setSession(next);
    setCourse(language);
    sendTelemetry(next.accessToken, "course_switched", {
      fromLanguage: previousLanguage,
      language,
      source: "home_header",
    });
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
            displayName={session.user.profile.displayName || session.user.email}
            email={session.user.email}
            onCourseChange={changeCourse}
            onSignOut={() => void logoutSession()}
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
              <Image
                source={logoImage}
                style={styles.logoImage}
                resizeMode="contain"
                accessible={false}
              />
              <Text style={styles.brand}>
                Shellty <Text style={styles.brandAccent}>Lingo</Text>
              </Text>
              <Text style={styles.welcomeText}>{copy.welcome}</Text>
            </View>
            {button(copy.start, () => {
              switchAuthMode("register");
              setScreen("auth");
            })}
            {button(
              copy.haveAccount,
              () => {
                switchAuthMode("login");
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
              <Field
                label={copy.displayName}
                hint={copy.displayNameHint}
                error={fieldErrors.name}
              >
                <TextInput
                  accessibilityLabel={copy.displayName}
                  accessibilityHint={fieldErrors.name ?? copy.displayNameHint}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    setFieldErrors((current) => ({
                      ...current,
                      name: undefined,
                    }));
                  }}
                  placeholder={copy.displayNamePlaceholder}
                  placeholderTextColor={colors.textPlaceholder}
                  autoComplete="name"
                  style={[styles.input, fieldErrors.name && styles.inputError]}
                />
              </Field>
            ) : null}
            <Field
              label={copy.email}
              hint={copy.emailHint}
              error={fieldErrors.email}
            >
              <TextInput
                accessibilityLabel={copy.email}
                accessibilityHint={fieldErrors.email ?? copy.emailHint}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setFieldErrors((current) => ({
                    ...current,
                    email: undefined,
                  }));
                }}
                placeholder={copy.emailPlaceholder}
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                style={[styles.input, fieldErrors.email && styles.inputError]}
              />
            </Field>
            <Field
              label={copy.password}
              hint={authMode === "register" ? copy.passwordHint : ""}
              error={fieldErrors.password}
            >
              <TextInput
                accessibilityLabel={copy.password}
                accessibilityHint={fieldErrors.password ?? copy.passwordHint}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setFieldErrors((current) => ({
                    ...current,
                    password: undefined,
                  }));
                }}
                placeholder={
                  authMode === "register"
                    ? copy.passwordPlaceholder
                    : copy.password
                }
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="none"
                autoComplete={
                  authMode === "register" ? "new-password" : "current-password"
                }
                secureTextEntry={!showPassword}
                style={[
                  styles.input,
                  fieldErrors.password && styles.inputError,
                ]}
              />
            </Field>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel={
                showPassword ? copy.hidePassword : copy.showPassword
              }
              accessibilityState={{ checked: showPassword }}
              onPress={() => setShowPassword((value) => !value)}
              style={styles.reveal}
            >
              <Text style={styles.revealText}>
                {showPassword ? copy.hidePassword : copy.showPassword}
              </Text>
            </Pressable>
            {formError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {formError}
              </Text>
            ) : null}
            {busy ? (
              <ActivityIndicator
                accessibilityLabel={copy.loading}
                color={colors.actionPrimary}
              />
            ) : (
              <>
                {button(
                  authMode === "login" ? copy.signIn : copy.createAccount,
                  () => void authenticate(authMode),
                )}
                {button(
                  authMode === "login" ? copy.createAccount : copy.haveAccount,
                  () =>
                    switchAuthMode(authMode === "login" ? "register" : "login"),
                  true,
                )}
                {button(copy.back, () => setScreen("welcome"), true)}
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
            {button(copy.continue, () => {
              if (session)
                sendTelemetry(
                  session.accessToken,
                  "onboarding_step_completed",
                  {
                    step: "locale",
                    locale,
                  },
                );
              setScreen("course");
            })}
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
            {button(copy.continue, () => {
              if (session)
                sendTelemetry(
                  session.accessToken,
                  "onboarding_step_completed",
                  {
                    step: "course",
                    language: course,
                    locale,
                  },
                );
              setScreen("goal");
            })}
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
                select(
                  `${minutes} ${copy.minutesShort}`,
                  dailyMinutes === minutes,
                  () => setDailyMinutes(minutes),
                ),
              )}
            </View>
            {busy ? (
              <ActivityIndicator />
            ) : (
              button(copy.finish, () => void finish())
            )}
            {formError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {formError}
              </Text>
            ) : null}
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
  logoImage: {
    width: 190,
    height: 155,
    marginBottom: spacing[4],
  },
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
  // A field in error is marked by the border *and* the message below it, never
  // by colour alone — §19.
  inputError: { borderColor: colors.error, borderWidth: 2 },
  field: { gap: spacing[2] },
  fieldLabel: { ...typography.title, fontSize: 15, color: colors.textPrimary },
  fieldHint: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  fieldError: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.error,
  },
  reveal: {
    alignSelf: "flex-start",
    minHeight: 48,
    justifyContent: "center",
    paddingRight: spacing[3],
  },
  revealText: { ...typography.body, fontSize: 14, color: colors.actionPrimary },
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
});
