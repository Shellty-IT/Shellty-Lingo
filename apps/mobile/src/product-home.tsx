import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  ConversationScenario,
  ConversationSessionResponse,
  ConversationSummary,
  ConversationTurnResponse,
  BillingCatalogResponse,
  BillingProduct,
  CorrectionMode,
  CourseLanguage,
  ProgressDashboardResponse,
  PrivacySettingsResponse,
  ReleaseConfigResponse,
  NotificationKind,
  ThaiPathResponse,
  TodayPlanResponse,
} from "@shellty/api-contracts";
import type { Locale } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";

import { apiRequest, idempotencyKey } from "./api";
import { activateDevelopmentPurchase, restorePurchases } from "./billing";
import { LearningFlow } from "./learning-flow";
import { ListeningLab } from "./listening-lab";
import { speak } from "./speech";

type Tab =
  | "today"
  | "learn"
  | "listening"
  | "chat"
  | "progress"
  | "profile"
  | "thai";

const labels = {
  pl: {
    today: "Dzisiaj",
    learn: "Nauka",
    listening: "Słuchanie i mówienie",
    listeningBody:
      "Krótkie scenki, odsłuch w wolniejszym tempie i prywatna próba głosowa.",
    chat: "Rozmowa",
    progress: "Postęp",
    plan: "Twój plan na dziś",
    ready: "Krótko, konkretnie, w Twoim tempie",
    completed: "ukończono",
    englishName: "ANGIELSKI",
    thaiName: "TAJSKI",
    remainingMessages: "wiadomości pozostało",
    streakDays: "dni serii",
    accuracy: "% skuteczności",
    lessonsMetric: "lekcji",
    wordsMetric: "słów",
    sevenDays: "7 dni",
    badges: "Odznaki",
    start: "Rozpocznij",
    scenarios: "Wybierz scenariusz",
    correction: "Tryb korekty",
    send: "Wyślij",
    finish: "Zakończ rozmowę",
    report: "Zgłoś odpowiedź",
    thai: "Alfabet i tony",
    transliteration: "Pokaż transliterację",
    noData: "Brak danych. Spróbuj ponownie.",
    metrics: "Ten tydzień",
    explanation: "Jak liczymy postęp?",
    profile: "Profil",
    premium: "Shellty Premium",
    premiumBody: "Więcej rozmów AI, wszystkie lekcje i rozszerzony postęp.",
    freePlan: "Plan bezpłatny",
    activePlan: "Premium aktywne",
    restore: "Przywróć zakupy",
    reminders: "Przypomnienia",
    reminderLearning: "Codzienna nauka",
    reminderReviews: "Powtórki do wykonania",
    reminderProduct: "Nowości produktu",
    quietHours: "Cisza 22:00–07:00",
    privacy: "Prywatność i dane",
    retention: "Rozmowy są automatycznie usuwane po 30 dniach.",
    sandboxBuy: "Aktywuj zakup testowy",
  },
  en: {
    today: "Today",
    learn: "Learn",
    listening: "Listening & speaking",
    listeningBody:
      "Short scenes, slower playback and a private speaking rehearsal.",
    chat: "Talk",
    progress: "Progress",
    plan: "Your plan for today",
    ready: "Short, practical, at your pace",
    completed: "completed",
    englishName: "ENGLISH",
    thaiName: "THAI",
    remainingMessages: "messages remaining",
    streakDays: "streak days",
    accuracy: "% accuracy",
    lessonsMetric: "lessons",
    wordsMetric: "words",
    sevenDays: "7 days",
    badges: "Badges",
    start: "Start",
    scenarios: "Choose a scenario",
    correction: "Correction mode",
    send: "Send",
    finish: "Finish conversation",
    report: "Report response",
    thai: "Thai script & tones",
    transliteration: "Show transliteration",
    noData: "No data. Please try again.",
    metrics: "This week",
    explanation: "How is progress calculated?",
    profile: "Profile",
    premium: "Shellty Premium",
    premiumBody: "More AI conversations, every lesson and extended progress.",
    freePlan: "Free plan",
    activePlan: "Premium active",
    restore: "Restore purchases",
    reminders: "Reminders",
    reminderLearning: "Daily learning",
    reminderReviews: "Reviews due",
    reminderProduct: "Product updates",
    quietHours: "Quiet hours 22:00–07:00",
    privacy: "Privacy and data",
    retention: "Conversations are automatically deleted after 30 days.",
    sandboxBuy: "Activate test purchase",
  },
  th: {
    today: "วันนี้",
    learn: "เรียน",
    listening: "ฝึกฟังและพูด",
    listeningBody: "สถานการณ์สั้น ฟังช้าลง และฝึกพูดแบบส่วนตัว",
    chat: "สนทนา",
    progress: "ความคืบหน้า",
    plan: "แผนของคุณวันนี้",
    ready: "สั้น ใช้ได้จริง ตามจังหวะของคุณ",
    completed: "เสร็จแล้ว",
    englishName: "ภาษาอังกฤษ",
    thaiName: "ภาษาไทย",
    remainingMessages: "ข้อความที่เหลือ",
    streakDays: "วันต่อเนื่อง",
    accuracy: "% ความแม่นยำ",
    lessonsMetric: "บทเรียน",
    wordsMetric: "คำศัพท์",
    sevenDays: "7 วัน",
    badges: "เหรียญรางวัล",
    start: "เริ่ม",
    scenarios: "เลือกสถานการณ์",
    correction: "รูปแบบการแก้ไข",
    send: "ส่ง",
    finish: "จบการสนทนา",
    report: "รายงานคำตอบ",
    thai: "อักษรและเสียงวรรณยุกต์",
    transliteration: "แสดงคำถอดเสียง",
    noData: "ไม่มีข้อมูล ลองอีกครั้ง",
    metrics: "สัปดาห์นี้",
    explanation: "คำนวณความคืบหน้าอย่างไร",
    profile: "โปรไฟล์",
    premium: "Shellty Premium",
    premiumBody: "สนทนากับ AI มากขึ้น ทุกบทเรียน และความคืบหน้าเพิ่มเติม",
    freePlan: "แผนฟรี",
    activePlan: "Premium เปิดใช้งานแล้ว",
    restore: "กู้คืนการซื้อ",
    reminders: "การแจ้งเตือน",
    reminderLearning: "เรียนทุกวัน",
    reminderReviews: "ถึงเวลาทบทวน",
    reminderProduct: "ข่าวสารผลิตภัณฑ์",
    quietHours: "ช่วงเงียบ 22:00–07:00",
    privacy: "ความเป็นส่วนตัวและข้อมูล",
    retention: "ระบบจะลบบทสนทนาโดยอัตโนมัติหลัง 30 วัน",
    sandboxBuy: "เปิดใช้การซื้อทดสอบ",
  },
} as const;

const correctionLabels: Record<CorrectionMode, Record<Locale, string>> = {
  after_each_message: {
    pl: "Po każdej wiadomości",
    en: "After each message",
    th: "หลังทุกข้อความ",
  },
  important_only: {
    pl: "Tylko ważne błędy",
    en: "Important errors only",
    th: "เฉพาะข้อผิดพลาดสำคัญ",
  },
  after_conversation: {
    pl: "Po rozmowie",
    en: "After the conversation",
    th: "หลังการสนทนา",
  },
  no_corrections: { pl: "Bez korekt", en: "No corrections", th: "ไม่แก้ไข" },
};

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
  const copy = labels[locale];
  const [tab, setTab] = useState<Tab>("today");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [plan, setPlan] = useState<TodayPlanResponse | null>(null);
  const [progress, setProgress] = useState<ProgressDashboardResponse | null>(
    null,
  );
  const [thai, setThai] = useState<ThaiPathResponse | null>(null);
  const [scenarios, setScenarios] = useState<ConversationScenario[]>([]);
  const [scenarioId, setScenarioId] = useState("");
  const [mode, setMode] = useState<CorrectionMode>("important_only");
  const [conversation, setConversation] =
    useState<ConversationSessionResponse | null>(null);
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [pendingTurnKey, setPendingTurnKey] = useState("");
  const [pendingConversationKey, setPendingConversationKey] = useState("");
  const [privacy, setPrivacy] = useState<PrivacySettingsResponse | null>(null);
  const [billing, setBilling] = useState<BillingCatalogResponse | null>(null);
  const [release, setRelease] = useState<ReleaseConfigResponse | null>(null);
  const [typing, setTyping] = useState<{
    chunks: string[];
    revealed: number;
  } | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError(false);
    try {
      const [
        nextPlan,
        nextProgress,
        nextScenarios,
        nextPrivacy,
        nextBilling,
        nextRelease,
      ] = await Promise.all([
        apiRequest<TodayPlanResponse>(
          `/growth/today?language=${language}&locale=${locale}`,
          { token },
        ),
        apiRequest<ProgressDashboardResponse>(
          `/growth/progress?language=${language}&locale=${locale}`,
          { token },
        ),
        apiRequest<ConversationScenario[]>(
          `/growth/conversations/scenarios?language=${language}`,
          { token },
        ),
        apiRequest<PrivacySettingsResponse>("/operations/privacy", { token }),
        apiRequest<BillingCatalogResponse>("/billing/catalog", { token }),
        apiRequest<ReleaseConfigResponse>("/release/config", { token }),
      ]);
      setPlan(nextPlan);
      setProgress(nextProgress);
      setScenarios(nextScenarios);
      setScenarioId((current) => current || nextScenarios[0]?.id || "");
      setPrivacy(nextPrivacy);
      setBilling(nextBilling);
      setRelease(nextRelease);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, [language, locale, token]);

  const toggleNotification = async (kind: NotificationKind) => {
    const current = privacy?.preferences.find((item) => item.kind === kind);
    if (!current) return;
    setBusy(true);
    setError(false);
    try {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const updated = await apiRequest<
        PrivacySettingsResponse["preferences"][number]
      >("/operations/notifications", {
        method: "PATCH",
        token,
        body: {
          kind,
          enabled: !current.enabled,
          localTime: current.localTime,
          timezone,
          quietHoursStart: current.quietHours.start,
          quietHoursEnd: current.quietHours.end,
        },
      });
      setPrivacy((value) =>
        value
          ? {
              ...value,
              preferences: value.preferences.map((item) =>
                item.kind === kind ? updated : item,
              ),
            }
          : value,
      );
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const access = await restorePurchases(token);
      setBilling((value) => (value ? { ...value, access } : value));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const sandboxPurchase = async (product: BillingProduct) => {
    setBusy(true);
    try {
      const access = await activateDevelopmentPurchase(token, product);
      setBilling((value) => (value ? { ...value, access } : value));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void apiRequest("/release/telemetry", {
      method: "POST",
      token,
      body: { event: "app_opened", properties: { language, locale } },
    }).catch(() => undefined);
  }, [language, locale, token]);

  // Keep the chat scrolled to the latest turn as messages arrive or the
  // assistant's reply is revealed.
  useEffect(() => {
    if (tab !== "chat") return;
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [tab, conversation?.messages.length, typing]);

  const openThai = async () => {
    setTab("thai");
    if (thai) return;
    setBusy(true);
    try {
      setThai(
        await apiRequest<ThaiPathResponse>("/growth/thai/path", { token }),
      );
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const startConversation = async () => {
    if (!scenarioId) return;
    const requestKey =
      pendingConversationKey ||
      idempotencyKey(
        "conversation-start",
        language,
        scenarioId,
        mode,
        Date.now().toString(),
      );
    setPendingConversationKey(requestKey);
    setBusy(true);
    setSummary(null);
    try {
      setConversation(
        await apiRequest<ConversationSessionResponse>("/growth/conversations", {
          method: "POST",
          token,
          body: {
            language,
            scenarioId,
            correctionMode: mode,
            idempotencyKey: requestKey,
          },
        }),
      );
      setPendingConversationKey("");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  // Reveals the assistant's reply chunk by chunk so the chat feels like a live
  // conversation instead of a message popping in all at once.
  const revealTyping = (chunks: string[]) =>
    new Promise<void>((resolve) => {
      if (chunks.length === 0) {
        resolve();
        return;
      }
      setTyping({ chunks, revealed: 1 });
      let revealed = 1;
      const interval = setInterval(() => {
        revealed += 1;
        if (revealed >= chunks.length) {
          clearInterval(interval);
          resolve();
          return;
        }
        setTyping({ chunks, revealed });
      }, 160);
    });

  const send = async () => {
    if (!conversation || !message.trim()) return;
    const learnerText = message.trim();
    const turnKey =
      pendingTurnKey || `conversation:${conversation.id}:${Date.now()}`;
    setPendingTurnKey(turnKey);
    setMessage("");
    setBusy(true);
    try {
      const turn = await apiRequest<ConversationTurnResponse>(
        `/growth/conversations/${conversation.id}/messages`,
        {
          method: "POST",
          token,
          body: { text: learnerText, idempotencyKey: turnKey },
        },
      );
      await revealTyping(turn.chunks);
      setConversation(
        await apiRequest<ConversationSessionResponse>(
          `/growth/conversations/${conversation.id}`,
          { token },
        ),
      );
      setPendingTurnKey("");
    } catch {
      setMessage(learnerText);
      setError(true);
    } finally {
      setTyping(null);
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!conversation) return;
    setBusy(true);
    try {
      setSummary(
        await apiRequest<ConversationSummary>(
          `/growth/conversations/${conversation.id}/complete`,
          { method: "POST", token, body: { locale } },
        ),
      );
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const listeningAvailable =
    release?.flags.find((flag) => flag.key === "listening_lab")?.available ===
    true;
  const speakingAvailable =
    release?.flags.find((flag) => flag.key === "async_speaking")?.available ===
    true;
  const aiAvailable =
    release?.flags.find((flag) => flag.key === "ai_conversations")
      ?.available === true;

  const content = useMemo(() => {
    if (busy && !plan)
      return <ActivityIndicator color={colors.actionPrimary} />;
    if (error && !plan) return <Text style={styles.error}>{copy.noData}</Text>;
    if (tab === "today")
      return (
        <View style={styles.section}>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>
              {language === "th"
                ? `🇹🇭 ${copy.thaiName}`
                : `🇬🇧 ${copy.englishName}`}
            </Text>
            <Text style={styles.heroTitle}>{copy.plan}</Text>
            <Text style={styles.heroText}>{copy.ready}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${plan ? Math.round((plan.completedItems / Math.max(1, plan.items.length)) * 100) : 0}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.heroMeta}>
              {plan?.completedItems ?? 0}/{plan?.items.length ?? 0}{" "}
              {copy.completed} · {plan?.totalMinutes ?? 0} min
            </Text>
          </View>
          {plan?.items.map((item, index) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}. ${item.detail}. ${item.minutes} min`}
              style={[styles.planCard, index === 0 && styles.planCardActive]}
              onPress={() => {
                if (item.action === "thai") void openThai();
                else if (item.action === "conversation")
                  setTab(aiAvailable ? "chat" : "learn");
                else setTab("learn");
              }}
            >
              <View
                style={[styles.planIcon, index === 0 && styles.planIconActive]}
              >
                <Text style={styles.planIconText}>
                  {item.kind === "review"
                    ? "↻"
                    : item.kind === "conversation"
                      ? "✦"
                      : item.kind === "thai"
                        ? "ก"
                        : "▶"}
                </Text>
              </View>
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.minutes}>{item.minutes} min ›</Text>
            </Pressable>
          ))}
        </View>
      );
    if (tab === "learn")
      return (
        <View style={styles.section}>
          {language === "th" ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.thai}
              style={styles.thaiBanner}
              onPress={() => void openThai()}
            >
              <Text style={styles.thaiGlyph}>ก</Text>
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>{copy.thai}</Text>
                <Text style={styles.cardDetail}>
                  Znaki · sylaby · reguły czytania · tony
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : null}
          {listeningAvailable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.listening}
              style={styles.listeningBanner}
              onPress={() => setTab("listening")}
            >
              <View style={styles.listeningIcon}>
                <Text style={styles.listeningIconText}>▶</Text>
              </View>
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>{copy.listening}</Text>
                <Text style={styles.cardDetail}>{copy.listeningBody}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ) : null}
          <LearningFlow
            token={token}
            locale={locale}
            preferredLanguage={language}
          />
        </View>
      );
    if (tab === "listening")
      return (
        <ListeningLab
          token={token}
          locale={locale}
          language={language}
          speakingEnabled={speakingAvailable}
          onBack={() => setTab("learn")}
        />
      );
    if (tab === "thai")
      return (
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.learn}
            onPress={() => setTab("learn")}
          >
            <Text style={styles.back}>‹ {copy.learn}</Text>
          </Pressable>
          <Text style={[styles.heading, styles.thaiText]}>{copy.thai}</Text>
          <Text style={styles.disclaimer}>{thai?.disclaimer}</Text>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={copy.transliteration}
            accessibilityState={{ checked: thai?.transliterationVisible }}
            style={styles.toggleRow}
            onPress={async () => {
              if (!thai) return;
              const enabled = !thai.transliterationVisible;
              setThai({
                ...thai,
                transliterationVisible: enabled,
                transliterationFadePercent: enabled ? 100 : 0,
              });
              await apiRequest("/growth/thai/transliteration", {
                method: "PATCH",
                token,
                body: { enabled },
              });
            }}
          >
            <Text style={styles.cardTitle}>{copy.transliteration}</Text>
            <Text style={styles.toggle}>
              {thai?.transliterationVisible ? "●" : "○"}
            </Text>
          </Pressable>
          {thai?.units.map((unit) => (
            <View key={unit.id} style={styles.thaiCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={unit.name}
                style={styles.audio}
                onPress={() => void speak(unit.glyph, "th-TH", 0.8)}
              >
                <Text style={styles.audioText}>♪</Text>
              </Pressable>
              <Text style={styles.glyph}>{unit.glyph}</Text>
              <View style={styles.grow}>
                <Text style={[styles.cardTitle, styles.thaiText]}>
                  {unit.name}
                </Text>
                {thai.transliterationVisible ? (
                  <Text style={styles.transliteration}>
                    {unit.transliteration} · {unit.tone ?? unit.toneClass ?? ""}
                  </Text>
                ) : null}
                <Text style={styles.cardDetail}>{unit.meaning}</Text>
                <Text style={styles.example}>
                  {unit.example.thai} · {unit.example.translation}
                </Text>
              </View>
            </View>
          ))}
        </View>
      );
    if (tab === "chat")
      return (
        <View style={styles.section}>
          <Text style={styles.heading}>{copy.chat}</Text>
          {!conversation ? (
            <>
              <Text style={styles.sectionLabel}>{copy.scenarios}</Text>
              {scenarios.map((scenario) => (
                <Pressable
                  key={scenario.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`${scenario.title}. ${scenario.description}`}
                  accessibilityState={{ checked: scenarioId === scenario.id }}
                  style={[
                    styles.choice,
                    scenarioId === scenario.id && styles.choiceActive,
                  ]}
                  onPress={() => {
                    setScenarioId(scenario.id);
                    setPendingConversationKey("");
                  }}
                >
                  <View style={styles.grow}>
                    <Text style={styles.cardTitle}>{scenario.title}</Text>
                    <Text style={styles.cardDetail}>
                      {scenario.description} · {scenario.estimatedMinutes} min
                    </Text>
                  </View>
                  <Text style={styles.radio}>
                    {scenarioId === scenario.id ? "●" : "○"}
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.sectionLabel}>{copy.correction}</Text>
              {(Object.keys(correctionLabels) as CorrectionMode[]).map(
                (item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="radio"
                    accessibilityLabel={correctionLabels[item][locale]}
                    accessibilityState={{ checked: mode === item }}
                    style={styles.mode}
                    onPress={() => {
                      setMode(item);
                      setPendingConversationKey("");
                    }}
                  >
                    <Text style={styles.cardDetail}>
                      {correctionLabels[item][locale]}
                    </Text>
                    <Text style={styles.radio}>
                      {mode === item ? "●" : "○"}
                    </Text>
                  </Pressable>
                ),
              )}
              <PrimaryButton
                label={copy.start}
                onPress={() => void startConversation()}
              />
            </>
          ) : summary ? (
            <>
              <View style={styles.summary}>
                <Text style={styles.heading}>✓</Text>
                <Text style={styles.cardTitle}>{summary.headline}</Text>
                <Text style={styles.cardDetail}>{summary.recommendation}</Text>
              </View>
              {summary.corrections.map((item, index) => (
                <View
                  key={`${item.original}-${index}`}
                  style={styles.correction}
                >
                  <Text style={styles.original}>{item.original}</Text>
                  <Text style={styles.corrected}>{item.corrected}</Text>
                  <Text style={styles.cardDetail}>{item.explanation}</Text>
                </View>
              ))}
              <PrimaryButton
                label={copy.start}
                onPress={() => {
                  setConversation(null);
                  setSummary(null);
                }}
              />
            </>
          ) : (
            <>
              <View style={styles.chatHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    {conversation.scenario.title}
                  </Text>
                  <Text style={styles.cardDetail}>
                    {conversation.remainingMessages} {copy.remainingMessages}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.report}
                  onPress={async () => {
                    await apiRequest(
                      `/growth/conversations/${conversation.id}/reports`,
                      { method: "POST", token, body: { reason: "quality" } },
                    );
                  }}
                >
                  <Text style={styles.report}>{copy.report}</Text>
                </Pressable>
              </View>
              {conversation.messages.length === 0 ? (
                <View style={styles.assistantBubble}>
                  <Text style={styles.assistantText}>
                    {language === "th"
                      ? "สวัสดีครับ/ค่ะ พร้อมสั่งอะไรดีครับ/คะ?"
                      : "Hello! What would you like today?"}
                  </Text>
                </View>
              ) : null}
              {conversation.messages.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.bubble,
                    item.role === "learner"
                      ? styles.learnerBubble
                      : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={
                      item.role === "learner"
                        ? styles.learnerText
                        : styles.assistantText
                    }
                  >
                    {item.text}
                  </Text>
                  {item.correction ? (
                    <View style={styles.inlineCorrection}>
                      <Text style={styles.corrected}>
                        ✓ {item.correction.corrected}
                      </Text>
                      <Text style={styles.cardDetail}>
                        {item.correction.explanation}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {typing ? (
                <View style={[styles.bubble, styles.assistantBubble]}>
                  <Text style={styles.assistantText}>
                    {typing.chunks.slice(0, typing.revealed).join(" ")}
                  </Text>
                  <Text style={styles.typingIndicator}>•••</Text>
                </View>
              ) : null}
              <View style={styles.composer}>
                <TextInput
                  accessibilityLabel={copy.chat}
                  value={message}
                  onChangeText={(value) => {
                    setMessage(value);
                    if (value.trim() !== message.trim()) setPendingTurnKey("");
                  }}
                  placeholder="…"
                  multiline
                  maxLength={800}
                  editable={!busy}
                  style={styles.messageInput}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.send}
                  accessibilityState={{ disabled: busy || !message.trim() }}
                  disabled={busy || !message.trim()}
                  style={[
                    styles.send,
                    (busy || !message.trim()) && styles.sendDisabled,
                  ]}
                  onPress={() => void send()}
                >
                  <Text style={styles.sendText}>➤</Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.finish}
                onPress={() => void complete()}
              >
                <Text style={styles.finish}>{copy.finish}</Text>
              </Pressable>
            </>
          )}
        </View>
      );
    if (tab === "progress")
      return (
        <View style={styles.section}>
          <Text style={styles.heading}>{copy.progress}</Text>
          <View style={styles.levelCard}>
            <Text style={styles.levelLabel}>
              {language.toUpperCase()} · {progress?.level}
            </Text>
            <Text style={styles.levelNumber}>
              {progress?.metrics.weeklyMinutes ?? 0}/
              {progress?.metrics.weeklyGoalMinutes ?? 0}
            </Text>
            <Text style={styles.cardDetail}>{copy.metrics} · min</Text>
          </View>
          <View style={styles.metricGrid}>
            <Metric
              value={progress?.metrics.streakDays ?? 0}
              label={copy.streakDays}
              icon="🔥"
            />
            <Metric
              value={progress?.metrics.accuracyPercent ?? 0}
              label={copy.accuracy}
              icon="◎"
            />
            <Metric
              value={progress?.metrics.lessonsCompleted ?? 0}
              label={copy.lessonsMetric}
              icon="✓"
            />
            <Metric
              value={progress?.metrics.wordsLearned ?? 0}
              label={copy.wordsMetric}
              icon="▣"
            />
          </View>
          <Text style={styles.sectionLabel}>{copy.sevenDays}</Text>
          <View style={styles.chart}>
            {progress?.lastSevenDays.map((day) => (
              <View key={day.date} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    { height: Math.max(5, Math.min(80, day.minutes * 4)) },
                  ]}
                />
                <Text style={styles.barLabel}>{day.date.slice(8)}</Text>
              </View>
            ))}
          </View>
          <View style={styles.info}>
            <Text style={styles.cardTitle}>{copy.explanation}</Text>
            <Text style={styles.cardDetail}>{progress?.explanation}</Text>
          </View>
          <Text style={styles.sectionLabel}>{copy.badges}</Text>
          {progress?.badges.map((badge) => (
            <View key={badge.id} style={styles.badge}>
              <Text style={styles.badgeIcon}>{badge.earned ? "★" : "☆"}</Text>
              <Text style={styles.cardTitle}>{badge.title}</Text>
            </View>
          ))}
        </View>
      );
    const reminderLabel: Record<NotificationKind, string> = {
      learning_reminder: copy.reminderLearning,
      review_due: copy.reminderReviews,
      product_updates: copy.reminderProduct,
    };
    return (
      <View style={styles.section}>
        <Text style={styles.heading}>{copy.profile}</Text>
        <View style={styles.premiumHero}>
          <View style={styles.planPill}>
            <Text style={styles.planPillText}>
              {billing?.access.plan === "premium"
                ? copy.activePlan
                : copy.freePlan}
            </Text>
          </View>
          <Text style={styles.premiumTitle}>{copy.premium}</Text>
          <Text style={styles.premiumText}>{copy.premiumBody}</Text>
          <Text style={styles.usageText}>
            AI · {billing?.access.limits.aiMessagesUsedToday ?? 0}/
            {billing?.access.limits.aiMessagesPerDay ?? 5}
          </Text>
        </View>
        {billing?.access.plan !== "premium"
          ? billing?.products.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.grow}>
                  <Text style={styles.cardTitle}>{product.title}</Text>
                  <Text style={styles.cardDetail}>
                    {product.displayPrice} · {product.period}
                  </Text>
                </View>
                {process.env.EXPO_PUBLIC_BILLING_SANDBOX === "true" ? (
                  <Pressable
                    accessibilityRole="button"
                    style={styles.smallButton}
                    onPress={() => void sandboxPurchase(product)}
                  >
                    <Text style={styles.smallButtonText}>
                      {copy.sandboxBuy}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.restore}
          onPress={() => void restore()}
        >
          <Text style={styles.finish}>{copy.restore}</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>{copy.reminders}</Text>
        <View style={styles.settingsGroup}>
          {privacy?.preferences.map((preference, index) => (
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: preference.enabled }}
              key={preference.kind}
              style={[
                styles.settingRow,
                index < privacy.preferences.length - 1 && styles.settingBorder,
              ]}
              onPress={() => void toggleNotification(preference.kind)}
            >
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>
                  {reminderLabel[preference.kind]}
                </Text>
                <Text style={styles.cardDetail}>
                  {preference.localTime} · {copy.quietHours}
                </Text>
              </View>
              <View
                style={[
                  styles.switchTrack,
                  preference.enabled && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    preference.enabled && styles.switchThumbActive,
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionLabel}>{copy.privacy}</Text>
        <View style={styles.info}>
          <Text style={styles.cardTitle}>{copy.privacy}</Text>
          <Text style={styles.cardDetail}>{copy.retention}</Text>
          <Text style={styles.policyMeta}>
            v{privacy?.policyVersion ?? "–"} · export 24 h
          </Text>
        </View>
      </View>
    );
  }, [
    busy,
    plan,
    error,
    tab,
    copy,
    language,
    progress,
    thai,
    token,
    locale,
    scenarios,
    scenarioId,
    mode,
    conversation,
    summary,
    message,
    pendingTurnKey,
    pendingConversationKey,
    privacy,
    billing,
    release,
    listeningAvailable,
    speakingAvailable,
    typing,
  ]);

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {header}
        {/* Inline, dismissible banner so failures after the first load (send,
            budget cap, toggle) are surfaced instead of failing silently. */}
        {error && plan ? (
          <View style={styles.errorBanner} accessibilityRole="alert">
            <Text style={styles.errorBannerText}>{copy.noData}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="OK"
              onPress={() => setError(false)}
            >
              <Text style={styles.errorBannerClose}>×</Text>
            </Pressable>
          </View>
        ) : null}
        {content}
        {footer}
      </ScrollView>
      {tab !== "thai" && tab !== "listening" ? (
        <View style={styles.nav} accessibilityRole="tablist">
          {(
            [
              ["today", "⌂", copy.today],
              ["learn", "▤", copy.learn],
              ["chat", "✦", copy.chat],
              ["progress", "▥", copy.progress],
              ["profile", "◉", copy.profile],
            ] as Array<[Tab, string, string]>
          )
            .filter(([name]) => name !== "chat" || aiAvailable)
            .map(([name, icon, label]) => (
              <Pressable
                key={name}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: tab === name }}
                style={styles.navItem}
                onPress={() => setTab(name)}
              >
                <Text
                  style={[styles.navIcon, tab === name && styles.navActive]}
                >
                  {icon}
                </Text>
                <Text
                  style={[styles.navLabel, tab === name && styles.navActive]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
        </View>
      ) : null}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.primaryButton}
      onPress={onPress}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}
function Metric({
  value,
  label,
  icon,
}: {
  value: number;
  label: string;
  icon: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollArea: { flex: 1 },
  scrollContent: { gap: spacing[4], paddingBottom: spacing[4] },
  section: { gap: spacing[3] },
  grow: { flex: 1 },
  error: { ...typography.body, color: colors.error },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    backgroundColor: colors.surfaceRose,
  },
  errorBannerText: {
    ...typography.body,
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  errorBannerClose: { color: colors.error, fontSize: 22 },
  hero: {
    backgroundColor: colors.backgroundInverse,
    borderRadius: radii.xl,
    padding: spacing[5],
    gap: spacing[2],
  },
  eyebrow: {
    ...typography.title,
    color: colors.accentTealOnInverse,
    fontSize: 12,
    letterSpacing: 1,
  },
  heroTitle: { ...typography.heading, color: colors.textInverse },
  heroText: {
    ...typography.body,
    color: colors.textOnInverseMuted,
    fontSize: 14,
  },
  heroMeta: {
    ...typography.body,
    color: colors.textOnInverseMuted,
    fontSize: 12,
  },
  progressTrack: {
    height: 7,
    borderRadius: 8,
    backgroundColor: colors.progressTrackInverse,
    overflow: "hidden",
    marginTop: spacing[2],
  },
  progressFill: { height: 7, backgroundColor: colors.accentTeal },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
  },
  planCardActive: { borderWidth: 2, borderColor: colors.actionPrimary },
  planIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  planIconActive: { backgroundColor: colors.actionPrimary },
  planIconText: { color: colors.textInverse, fontSize: 19, fontWeight: "800" },
  cardTitle: { ...typography.title, color: colors.textPrimary, fontSize: 15 },
  cardDetail: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  minutes: { ...typography.title, color: colors.actionPrimary, fontSize: 12 },
  thaiBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceTeal,
  },
  thaiGlyph: { ...typography.thai, fontSize: 34, color: colors.actionSupport },
  chevron: { fontSize: 26, color: colors.actionSupport },
  back: { ...typography.title, color: colors.actionPrimary, fontSize: 14 },
  heading: { ...typography.heading, color: colors.textPrimary },
  thaiText: { fontFamily: typography.thai.fontFamily },
  disclaimer: {
    ...typography.body,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    padding: spacing[3],
    backgroundColor: colors.surfaceAmber,
    borderRadius: radii.md,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing[4],
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
  },
  toggle: { color: colors.actionSupport, fontSize: 24 },
  thaiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  audio: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  audioText: { color: colors.textInverse, fontSize: 18 },
  glyph: { ...typography.thai, fontSize: 42, color: colors.textPrimary },
  transliteration: {
    ...typography.body,
    color: colors.actionPrimary,
    fontSize: 13,
  },
  example: { ...typography.thai, color: colors.actionSupport, fontSize: 13 },
  sectionLabel: {
    ...typography.title,
    color: colors.textSecondary,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: spacing[2],
  },
  choice: {
    flexDirection: "row",
    gap: spacing[3],
    alignItems: "center",
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  choiceActive: {
    borderWidth: 2,
    borderColor: colors.actionPrimary,
    backgroundColor: colors.surfaceBlue,
  },
  radio: { color: colors.actionPrimary, fontSize: 20 },
  mode: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.md,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.actionPrimary,
    marginTop: spacing[2],
  },
  primaryButtonText: { ...typography.title, color: colors.textInverse },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderColor: colors.borderDefault,
  },
  report: { ...typography.body, color: colors.error, fontSize: 11 },
  bubble: { maxWidth: "88%", padding: spacing[4], borderRadius: radii.lg },
  learnerBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.actionPrimary,
    borderBottomRightRadius: 5,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderBottomLeftRadius: 5,
    padding: spacing[4],
    borderRadius: radii.lg,
  },
  learnerText: { ...typography.body, color: colors.textInverse },
  assistantText: { ...typography.body, color: colors.textPrimary },
  typingIndicator: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing[1],
    letterSpacing: 1,
  },
  inlineCorrection: {
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.surfaceTeal,
    borderRadius: radii.md,
  },
  corrected: { ...typography.title, color: colors.success, fontSize: 13 },
  original: {
    ...typography.body,
    color: colors.error,
    fontSize: 13,
    textDecorationLine: "line-through",
  },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: spacing[2] },
  messageInput: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: spacing[3],
    ...typography.body,
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: colors.textInverse, fontSize: 20 },
  finish: {
    ...typography.title,
    color: colors.actionPrimary,
    textAlign: "center",
    fontSize: 13,
  },
  summary: {
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[6],
    backgroundColor: colors.surfaceTeal,
    borderRadius: radii.xl,
  },
  correction: {
    padding: spacing[4],
    gap: spacing[1],
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
  },
  levelCard: {
    padding: spacing[5],
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundInverse,
  },
  levelLabel: {
    ...typography.title,
    color: colors.accentTealOnInverse,
    fontSize: 12,
  },
  levelNumber: {
    ...typography.display,
    color: colors.textInverse,
    marginTop: spacing[2],
  },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[3] },
  metric: {
    width: "47%",
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  metricIcon: { fontSize: 18 },
  metricValue: {
    ...typography.heading,
    color: colors.textPrimary,
    marginTop: spacing[1],
  },
  metricLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 11,
  },
  chart: {
    height: 110,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    padding: spacing[3],
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 90,
    gap: 4,
  },
  bar: { width: 18, borderRadius: 5, backgroundColor: colors.actionPrimary },
  barLabel: { ...typography.body, color: colors.textSecondary, fontSize: 9 },
  info: {
    padding: spacing[4],
    gap: spacing[1],
    backgroundColor: colors.surfaceBlue,
    borderRadius: radii.lg,
  },
  premiumHero: {
    padding: spacing[5],
    gap: spacing[2],
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundInverse,
  },
  planPill: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radii.pill,
    backgroundColor: "rgba(127, 227, 216, 0.14)",
  },
  planPillText: {
    ...typography.title,
    color: colors.accentTealOnInverse,
    fontSize: 11,
  },
  premiumTitle: { ...typography.heading, color: colors.textInverse },
  premiumText: {
    ...typography.body,
    color: colors.textOnInverseMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  usageText: {
    ...typography.title,
    color: colors.accentTealOnInverse,
    fontSize: 12,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
  },
  smallButton: {
    maxWidth: 125,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.actionPrimary,
  },
  smallButtonText: {
    ...typography.title,
    color: colors.textInverse,
    fontSize: 10,
    textAlign: "center",
  },
  settingsGroup: {
    overflow: "hidden",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
  },
  settingRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  settingBorder: { borderBottomWidth: 1, borderColor: colors.borderSubtle },
  switchTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 3,
    backgroundColor: colors.switchTrackOff,
  },
  switchTrackActive: { backgroundColor: colors.actionPrimary },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundCard,
  },
  switchThumbActive: { alignSelf: "flex-end" },
  policyMeta: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: spacing[2],
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
  },
  badgeIcon: { color: colors.accentGold, fontSize: 24 },
  listeningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.surfaceBlueRaised,
    borderWidth: 1,
    borderColor: colors.borderBlue,
    borderRadius: radii.lg,
  },
  listeningIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.actionPrimary,
  },
  listeningIconText: { color: colors.textInverse, fontSize: 15, marginLeft: 2 },
  nav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.backgroundCard,
    borderRadius: radii.lg,
    paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  navItem: { flex: 1, alignItems: "center", gap: 2 },
  navIcon: { color: colors.textSecondary, fontSize: 20 },
  navLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  navActive: { color: colors.actionPrimary, fontWeight: "800" },
});
