import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import type { CourseLanguage } from "@shellty/api-contracts";
import { getCopy, type Locale } from "@shellty/i18n";

import { ChatTab } from "./home/chat-tab";
import { LearnTab } from "./home/learn-tab";
import { NavBar } from "./home/nav-bar";
import { ProfileTab } from "./home/profile-tab";
import { ProgressTab } from "./home/progress-tab";
import { styles } from "./home/styles";
import { ThaiTab } from "./home/thai-tab";
import { TodayTab } from "./home/today-tab";
import type { Tab } from "./home/types";
import { useReleaseConfig, sendTelemetry } from "./queries/release";
import { ListeningLab } from "./listening-lab";
import type { LearningIntent } from "./learning-intent";
import { CourseSwitcher } from "./ui/course-switcher";

export function ProductHome({
  token,
  locale,
  language,
  displayName,
  email,
  onCourseChange,
  onSignOut,
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  displayName: string;
  email: string;
  onCourseChange: (language: CourseLanguage) => Promise<void>;
  onSignOut: () => void;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [tab, setTab] = useState<Tab>("today");
  const [actionError, setActionError] = useState<string | null>(null);
  const [courseSwitching, setCourseSwitching] = useState(false);
  const [learningIntent, setLearningIntent] = useState<LearningIntent | null>(
    null,
  );
  const [learningFocused, setLearningFocused] = useState(false);
  const [practiceFocused, setPracticeFocused] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const releaseQuery = useReleaseConfig(token);

  // Fires once per screen mount, matching the previous one-shot telemetry call.
  const telemetrySent = useRef(false);
  useEffect(() => {
    if (telemetrySent.current) return;
    telemetrySent.current = true;
    sendTelemetry(token, "app_opened", { language, locale });
  }, [token, language, locale]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [learningFocused, practiceFocused, tab]);

  const listeningAvailable =
    releaseQuery.data?.flags.find((flag) => flag.key === "listening_lab")
      ?.available === true;
  const speakingAvailable =
    releaseQuery.data?.flags.find((flag) => flag.key === "async_speaking")
      ?.available === true;
  const aiAvailable =
    releaseQuery.data?.flags.find((flag) => flag.key === "ai_conversations")
      ?.available === true;

  const showTab = (next: Tab) => setTab(next);
  const openThai = () => setTab("thai");
  const revealAnswerInput = useCallback(() => {
    const reveal = () => scrollRef.current?.scrollToEnd({ animated: true });
    reveal();
    setTimeout(reveal, 250);
  }, []);
  const globalTab = tab !== "thai" && tab !== "listening";
  const titleByTab: Partial<Record<Tab, string>> = {
    today: copy.homeTitle,
    learn: copy.learn,
    chat: copy.practice,
    progress: copy.progress,
  };

  const changeCourse = async (next: CourseLanguage) => {
    if (next === language || courseSwitching) return;
    setActionError(null);
    setCourseSwitching(true);
    try {
      await onCourseChange(next);
      setLearningIntent(null);
      setLearningFocused(false);
      setTab("today");
    } catch {
      setActionError(copy.courseSwitchError);
    } finally {
      setCourseSwitching(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {globalTab &&
        tab !== "profile" &&
        !learningFocused &&
        !practiceFocused ? (
          <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>{titleByTab[tab]}</Text>
            <CourseSwitcher
              language={language}
              copy={copy}
              disabled={courseSwitching}
              onChange={(next) => void changeCourse(next)}
            />
          </View>
        ) : null}
        {/* Dismissible so an action failure (send, budget cap, toggle) is
            surfaced without blocking the rest of the screen. */}
        {actionError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorBannerText}>{actionError}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.dismiss}
              onPress={() => setActionError(null)}
              style={styles.errorBannerDismiss}
            >
              <Text style={styles.errorBannerClose}>×</Text>
            </Pressable>
          </View>
        ) : null}

        {tab === "today" ? (
          <TodayTab
            token={token}
            language={language}
            locale={locale}
            copy={copy}
            aiAvailable={aiAvailable}
            onOpenThai={openThai}
            onSelectTab={showTab}
            onStartLearning={(intent) => {
              setLearningIntent(intent);
              setTab("learn");
            }}
          />
        ) : null}
        {tab === "learn" ? (
          <LearnTab
            token={token}
            locale={locale}
            language={language}
            copy={copy}
            listeningAvailable={listeningAvailable}
            onOpenThai={openThai}
            onOpenListening={() => setTab("listening")}
            initialIntent={learningIntent}
            onIntentHandled={() => setLearningIntent(null)}
            onFocusedChange={setLearningFocused}
            onAnswerFocus={revealAnswerInput}
          />
        ) : null}
        {tab === "listening" ? (
          <ListeningLab
            token={token}
            locale={locale}
            language={language}
            speakingEnabled={speakingAvailable}
            onBack={() => setTab("learn")}
          />
        ) : null}
        {tab === "thai" ? (
          <ThaiTab
            token={token}
            copy={copy}
            onBack={() => setTab("learn")}
            onActionError={() => setActionError(copy.conversationLoadErrorBody)}
          />
        ) : null}
        {tab === "chat" ? (
          <ChatTab
            token={token}
            locale={locale}
            language={language}
            copy={copy}
            scrollRef={scrollRef}
            onActionError={() => setActionError(copy.noData)}
            voiceEnabled={speakingAvailable}
            onFocusedChange={setPracticeFocused}
          />
        ) : null}
        {tab === "progress" ? (
          <ProgressTab
            token={token}
            language={language}
            locale={locale}
            copy={copy}
          />
        ) : null}
        {tab === "profile" ? (
          <ProfileTab
            token={token}
            copy={copy}
            displayName={displayName}
            email={email}
            onSignOut={onSignOut}
            onActionError={() => setActionError(copy.noData)}
          />
        ) : null}
      </ScrollView>
      {tab !== "thai" &&
      tab !== "listening" &&
      !learningFocused &&
      !practiceFocused ? (
        <NavBar
          tab={tab}
          onSelect={showTab}
          aiAvailable={aiAvailable}
          copy={copy}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}
