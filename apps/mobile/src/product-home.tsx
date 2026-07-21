import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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

export function ProductHome({
  token,
  locale,
  language,
  header,
  footer,
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  /** Rendered above the tab content, inside the scrollable area. */
  header?: ReactNode;
  /** Rendered below the tab content, inside the scrollable area. */
  footer?: ReactNode;
}) {
  const copy = useMemo(() => getCopy(locale), [locale]);
  const [tab, setTab] = useState<Tab>("today");
  const [actionError, setActionError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const releaseQuery = useReleaseConfig(token);

  // Fires once per screen mount, matching the previous one-shot telemetry call.
  const telemetrySent = useRef(false);
  useEffect(() => {
    if (telemetrySent.current) return;
    telemetrySent.current = true;
    sendTelemetry(token, "app_opened", { language, locale });
  }, [token, language, locale]);

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

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        {/* Dismissible so an action failure (send, budget cap, toggle) is
            surfaced without blocking the rest of the screen. */}
        {actionError ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorBannerText}>{copy.noData}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="OK"
              onPress={() => setActionError(false)}
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
          <ThaiTab token={token} copy={copy} onBack={() => setTab("learn")} />
        ) : null}
        {tab === "chat" ? (
          <ChatTab
            token={token}
            locale={locale}
            language={language}
            copy={copy}
            scrollRef={scrollRef}
            onActionError={() => setActionError(true)}
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
            onActionError={() => setActionError(true)}
          />
        ) : null}

        {footer}
      </ScrollView>
      {tab !== "thai" && tab !== "listening" ? (
        <NavBar
          tab={tab}
          onSelect={showTab}
          aiAvailable={aiAvailable}
          copy={copy}
        />
      ) : null}
    </View>
  );
}
