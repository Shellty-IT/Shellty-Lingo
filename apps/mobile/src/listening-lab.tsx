import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { deleteAsync } from "expo-file-system/legacy";
import type {
  CourseLanguage,
  ListeningAttemptResponse,
  ListeningChallenge,
} from "@shellty/api-contracts";
import type { Locale } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";
import { apiRequest } from "./api";
import { speak } from "./speech";

const copy = {
  pl: {
    back: "Nauka",
    eyebrow: "LABORATORIUM SŁUCHANIA",
    title: "Usłysz. Zrozum. Powtórz.",
    description:
      "Krótkie scenki do ćwiczenia rozumienia i własnego tempa mówienia.",
    play: "Odtwórz",
    slower: "Wolniej",
    check: "Sprawdź odpowiedź",
    next: "Następne ćwiczenie",
    correct: "Świetnie — to właściwa odpowiedź.",
    incorrect: "Posłuchaj jeszcze raz i porównaj z transkrypcją.",
    transcript: "Transkrypcja",
    record: "Nagraj swoją próbę",
    recording: "Nagrywam…",
    stop: "Zatrzymaj",
    replay: "Odsłuchaj swoją próbę",
    discard: "Usuń nagranie",
    privacy:
      "Nagranie zostaje tylko na tym urządzeniu i jest usuwane po wyjściu.",
    permission: "Aby nagrać próbę, zezwól aplikacji na dostęp do mikrofonu.",
    error: "Nie udało się załadować ćwiczenia. Spróbuj ponownie.",
  },
  en: {
    back: "Learn",
    eyebrow: "LISTENING LAB",
    title: "Hear it. Understand it. Say it.",
    description:
      "Short scenes for listening comprehension and speaking at your pace.",
    play: "Play",
    slower: "Slower",
    check: "Check answer",
    next: "Next challenge",
    correct: "Great — that is the right answer.",
    incorrect: "Listen again and compare it with the transcript.",
    transcript: "Transcript",
    record: "Record your attempt",
    recording: "Recording…",
    stop: "Stop",
    replay: "Replay your attempt",
    discard: "Delete recording",
    privacy:
      "The recording stays on this device and is deleted when you leave.",
    permission: "Allow microphone access to record your attempt.",
    error: "We could not load this challenge. Please try again.",
  },
  th: {
    back: "เรียน",
    eyebrow: "ห้องฝึกการฟัง",
    title: "ฟัง เข้าใจ แล้วพูดตาม",
    description: "สถานการณ์สั้น ๆ เพื่อฝึกฟังและพูดตามจังหวะของคุณ",
    play: "ฟัง",
    slower: "ช้าลง",
    check: "ตรวจคำตอบ",
    next: "แบบฝึกหัดถัดไป",
    correct: "เยี่ยมมาก คำตอบถูกต้อง",
    incorrect: "ฟังอีกครั้งแล้วเปรียบเทียบกับข้อความ",
    transcript: "ข้อความเสียง",
    record: "บันทึกเสียงของคุณ",
    recording: "กำลังบันทึก…",
    stop: "หยุด",
    replay: "ฟังเสียงของคุณ",
    discard: "ลบเสียง",
    privacy: "เสียงจะอยู่ในอุปกรณ์นี้เท่านั้นและลบเมื่อออกจากหน้านี้",
    permission: "โปรดอนุญาตให้ใช้ไมโครโฟนเพื่อบันทึกเสียง",
    error: "โหลดแบบฝึกหัดไม่ได้ โปรดลองอีกครั้ง",
  },
} as const;

export function ListeningLab({
  token,
  locale,
  language,
  speakingEnabled,
  onBack,
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  speakingEnabled: boolean;
  onBack: () => void;
}) {
  const labels = copy[locale];
  const [challenges, setChallenges] = useState<ListeningChallenge[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [attemptKey, setAttemptKey] = useState("");
  const [result, setResult] = useState<ListeningAttemptResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [microphoneError, setMicrophoneError] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY, (status) => {
    if (status.isFinished && status.url) {
      setRecordingUri(status.url);
      void setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
    }
  });
  const recorderState = useAudioRecorderState(recorder, 250);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);
  const challenge = challenges[index];

  const telemetry = useCallback(
    (event: "listening_started" | "listening_completed") =>
      apiRequest("/release/telemetry", {
        method: "POST",
        token,
        body: { event, properties: { language } },
      }).catch(() => undefined),
    [language, token],
  );

  useEffect(() => {
    let active = true;
    setBusy(true);
    apiRequest<ListeningChallenge[]>(
      `/growth/listening/challenges?language=${language}`,
      { token },
    )
      .then((items) => {
        if (!active) return;
        setChallenges(items);
        setError(false);
        void telemetry("listening_started");
      })
      .catch(() => active && setError(true))
      .finally(() => active && setBusy(false));
    return () => {
      active = false;
    };
  }, [language, telemetry, token]);

  useEffect(
    () => () => {
      if (recordingUri) void deleteAsync(recordingUri, { idempotent: true });
    },
    [recordingUri],
  );

  const playPrompt = async (slower = false) => {
    if (!challenge) return;
    await speak(
      challenge.audio.text,
      challenge.audio.locale,
      slower ? challenge.audio.rate * 0.78 : challenge.audio.rate,
    );
  };

  const submit = async () => {
    if (!challenge || !selected || !attemptKey) return;
    setBusy(true);
    try {
      const response = await apiRequest<ListeningAttemptResponse>(
        `/growth/listening/challenges/${challenge.id}/attempts`,
        {
          method: "POST",
          token,
          body: {
            optionId: selected,
            idempotencyKey: attemptKey,
          },
        },
      );
      setResult(response);
      if (response.correct) void telemetry("listening_completed");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    setMicrophoneError(false);
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setMicrophoneError(true);
      return;
    }
    if (recordingUri) {
      await deleteAsync(recordingUri, { idempotent: true });
      setRecordingUri(null);
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record({ forDuration: 30 });
  };

  const stopRecording = async () => {
    await recorder.stop();
    setRecordingUri(recorder.uri);
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
    });
  };

  const replayRecording = () => {
    if (!recordingUri) return;
    player.replace(recordingUri);
    player.play();
  };

  const discardRecording = async () => {
    player.pause();
    if (recordingUri) await deleteAsync(recordingUri, { idempotent: true });
    setRecordingUri(null);
  };

  const next = async () => {
    await discardRecording();
    setSelected("");
    setAttemptKey("");
    setResult(null);
    setIndex((value) => (value + 1) % Math.max(1, challenges.length));
  };

  if (busy && !challenge)
    return <ActivityIndicator color={colors.actionPrimary} />;
  if (error && !challenge)
    return <Text style={styles.error}>{labels.error}</Text>;
  if (!challenge) return null;

  const elapsed = recorderState.isRecording
    ? Math.round(recorderState.durationMillis / 1000)
    : Math.round(playerStatus.currentTime);

  return (
    <View style={styles.screen}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ {labels.back}</Text>
      </Pressable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{labels.eyebrow}</Text>
        <Text style={styles.heroTitle}>{labels.title}</Text>
        <Text style={styles.heroText}>{labels.description}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroPill}>{challenge.level}</Text>
          <Text style={styles.heroCount}>
            {index + 1}/{challenges.length}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.challengeTitle}>{challenge.title}</Text>
        <Text style={styles.instruction}>{challenge.instruction}</Text>
        <View style={styles.player}>
          <Pressable
            style={styles.playButton}
            onPress={() => void playPrompt()}
          >
            <Text style={styles.playIcon}>▶</Text>
          </Pressable>
          <View style={styles.playerBody}>
            <View style={styles.track}>
              <View style={styles.trackFill} />
            </View>
            <Text style={styles.playerLabel}>{labels.play}</Text>
          </View>
          <Pressable onPress={() => void playPrompt(true)}>
            <Text style={styles.slower}>
              0.75×{`\n`}
              {labels.slower}
            </Text>
          </Pressable>
        </View>

        {challenge.options.map((option) => (
          <Pressable
            key={option.id}
            disabled={Boolean(result)}
            onPress={() => {
              setSelected(option.id);
              setAttemptKey(`${challenge.id}:${Date.now()}`);
            }}
            style={[
              styles.option,
              selected === option.id && styles.optionSelected,
            ]}
          >
            <Text
              style={[
                styles.optionText,
                selected === option.id && styles.optionTextSelected,
              ]}
            >
              {option.text}
            </Text>
          </Pressable>
        ))}

        {result ? (
          <View
            style={[
              styles.feedback,
              result.correct ? styles.success : styles.warning,
            ]}
          >
            <Text style={styles.feedbackTitle}>
              {result.correct ? labels.correct : labels.incorrect}
            </Text>
            <Text style={styles.transcriptLabel}>{labels.transcript}</Text>
            <Text style={styles.transcript}>{result.transcript}</Text>
            <Text style={styles.explanation}>{result.explanation}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primary, (!selected || busy) && styles.disabled]}
          disabled={!selected || busy}
          onPress={() => void (result ? next() : submit())}
        >
          <Text style={styles.primaryText}>
            {result ? labels.next : labels.check}
          </Text>
        </Pressable>
      </View>

      {speakingEnabled ? (
        <View style={styles.card}>
          <Text style={styles.challengeTitle}>{labels.record}</Text>
          <Text style={styles.privacy}>{labels.privacy}</Text>
          {recorderState.isRecording ? (
            <View style={styles.recordingBox}>
              <Text style={styles.recordingLabel}>
                {labels.recording} {elapsed}s
              </Text>
              <Pressable
                style={styles.stopButton}
                onPress={() => void stopRecording()}
              >
                <View style={styles.stopIcon} />
              </Pressable>
              <Text style={styles.recordingLabel}>{labels.stop}</Text>
            </View>
          ) : (
            <View style={styles.recordActions}>
              <Pressable
                style={styles.recordButton}
                onPress={() => void startRecording()}
              >
                <View style={styles.recordDot} />
                <Text style={styles.recordText}>{labels.record}</Text>
              </Pressable>
              {recordingUri ? (
                <>
                  <Pressable
                    style={styles.replayButton}
                    onPress={replayRecording}
                  >
                    <Text style={styles.replayText}>
                      ▶ {labels.replay} {elapsed > 0 ? `${elapsed}s` : ""}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => void discardRecording()}>
                    <Text style={styles.discard}>{labels.discard}</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          )}
          {microphoneError ? (
            <Text style={styles.error}>{labels.permission}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing[3] },
  back: { ...typography.body, color: colors.actionPrimary, fontWeight: "800" },
  hero: {
    backgroundColor: colors.backgroundInverse,
    borderRadius: radii.xl,
    padding: spacing[5],
    gap: spacing[2],
  },
  eyebrow: {
    ...typography.title,
    color: "#5BC9E8",
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.2,
  },
  heroTitle: {
    ...typography.heading,
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
  },
  heroText: { ...typography.body, color: "#C8D6EA" },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[2],
  },
  heroPill: {
    ...typography.title,
    color: colors.backgroundInverse,
    backgroundColor: "#5BC9E8",
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    fontSize: 12,
    lineHeight: 16,
  },
  heroCount: {
    ...typography.title,
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.xl,
    padding: spacing[4],
    gap: spacing[3],
  },
  challengeTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 19,
  },
  instruction: { ...typography.body, color: colors.textSecondary },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    backgroundColor: colors.backgroundApp,
    borderRadius: radii.lg,
    padding: spacing[3],
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { color: "#FFFFFF", fontSize: 16, marginLeft: 2 },
  playerBody: { flex: 1, gap: spacing[1] },
  track: {
    height: 6,
    backgroundColor: "#DCE5F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  trackFill: { width: "45%", height: 6, backgroundColor: colors.actionPrimary },
  playerLabel: {
    ...typography.title,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  slower: {
    ...typography.title,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  option: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.lg,
    padding: spacing[3],
    justifyContent: "center",
  },
  optionSelected: {
    borderColor: colors.actionPrimary,
    backgroundColor: "#EAF2FF",
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  optionTextSelected: { color: colors.actionPrimary },
  feedback: { borderRadius: radii.lg, padding: spacing[3], gap: spacing[2] },
  success: { backgroundColor: "#EAF8F3" },
  warning: { backgroundColor: "#FFF5E8" },
  feedbackTitle: { ...typography.title, color: colors.textPrimary },
  transcriptLabel: {
    ...typography.title,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  transcript: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 17,
  },
  explanation: { ...typography.body, color: colors.textSecondary },
  primary: {
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { ...typography.title, color: "#FFFFFF" },
  disabled: { opacity: 0.45 },
  privacy: { ...typography.body, color: colors.textSecondary, fontSize: 12 },
  recordingBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: "#FDF1F1",
    borderColor: "#F4C9C9",
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  recordingLabel: { ...typography.title, color: "#C2453F" },
  stopButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#E4453F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: "#F6CECC",
  },
  stopIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  recordActions: { gap: spacing[2] },
  recordButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radii.lg,
    backgroundColor: "#FDF1F1",
    borderWidth: 1,
    borderColor: "#F4C9C9",
  },
  recordDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E4453F",
  },
  recordText: { ...typography.title, color: "#C2453F" },
  replayButton: {
    minHeight: 48,
    borderRadius: radii.lg,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  replayText: { ...typography.title, color: colors.actionPrimary },
  discard: {
    ...typography.title,
    color: colors.error,
    textAlign: "center",
    padding: spacing[2],
  },
  error: { ...typography.body, color: colors.error },
});
