import { useEffect, useRef, useState } from "react";
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
import type {
  CourseLanguage,
  ListeningAttemptResponse,
} from "@shellty/api-contracts";
import { getCopy, type Locale } from "@shellty/i18n";
import { colors, radii, spacing, typography } from "@shellty/ui";

import {
  useListeningAttempt,
  useListeningChallenges,
} from "./queries/listening";
import { discardLocalRecording } from "./local-recording";
import { sendTelemetry } from "./queries/release";
import { speak } from "./speech";

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
  const copy = getCopy(locale);
  const challengesQuery = useListeningChallenges(token, language, locale);
  const attemptMutation = useListeningAttempt(token);
  const challenges = challengesQuery.data ?? [];
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [attemptKey, setAttemptKey] = useState("");
  const [result, setResult] = useState<ListeningAttemptResponse | undefined>(
    undefined,
  );
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [microphoneError, setMicrophoneError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
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

  const telemetrySent = useRef(false);
  useEffect(() => {
    if (!challengesQuery.isSuccess || telemetrySent.current) return;
    telemetrySent.current = true;
    sendTelemetry(token, "listening_started", { language });
  }, [challengesQuery.isSuccess, token, language]);

  useEffect(
    () => () => {
      if (recordingUri) void discardLocalRecording(recordingUri);
    },
    [recordingUri],
  );

  const playPrompt = async (slower = false) => {
    if (!challenge) return;
    setActionError(null);
    try {
      await speak(
        challenge.audio.text,
        challenge.audio.locale,
        slower ? challenge.audio.rate * 0.78 : challenge.audio.rate,
      );
    } catch {
      setActionError(copy.voiceUnavailable);
    }
  };

  const submit = () => {
    if (!challenge || !selected || !attemptKey) return;
    attemptMutation.mutate(
      {
        challengeId: challenge.id,
        optionId: selected,
        idempotencyKey: attemptKey,
        interfaceLocale: locale,
      },
      {
        onSuccess: (response) => {
          setActionError(null);
          setResult(response);
        },
        onError: () => setActionError(copy.listeningSubmitError),
      },
    );
  };

  const startRecording = async () => {
    setMicrophoneError(false);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMicrophoneError(true);
        return;
      }
      if (recordingUri) {
        await discardLocalRecording(recordingUri);
        setRecordingUri(null);
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 30 });
    } catch {
      setMicrophoneError(true);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => undefined);
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      setRecordingUri(recorder.uri);
    } catch {
      setMicrophoneError(true);
    } finally {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      }).catch(() => undefined);
    }
  };

  const replayRecording = () => {
    if (!recordingUri) return;
    try {
      player.replace(recordingUri);
      player.play();
      setActionError(null);
    } catch {
      setActionError(copy.voiceUnavailable);
    }
  };

  const discardRecording = async () => {
    try {
      player.pause();
      if (recordingUri) await discardLocalRecording(recordingUri);
    } catch {
      setActionError(copy.voiceUnavailable);
    } finally {
      setRecordingUri(null);
    }
  };

  const next = async () => {
    await discardRecording();
    setSelected("");
    setAttemptKey("");
    setResult(undefined);
    setActionError(null);
    setIndex((value) => (value + 1) % Math.max(1, challenges.length));
  };

  const busy = attemptMutation.isPending;
  const elapsed = recorderState.isRecording
    ? Math.round(recorderState.durationMillis / 1000)
    : Math.round(playerStatus.currentTime);

  const backButton = (
    <Pressable
      onPress={onBack}
      accessibilityRole="button"
      accessibilityLabel={copy.learn}
    >
      <Text style={styles.back}>‹ {copy.learn}</Text>
    </Pressable>
  );

  if (challengesQuery.isLoading && !challenge)
    return (
      <View style={styles.screen}>
        {backButton}
        <ActivityIndicator color={colors.actionPrimary} />
      </View>
    );
  if (challengesQuery.isError && !challenge)
    return (
      <View style={styles.screen}>
        {backButton}
        <Text accessibilityRole="alert" style={styles.error}>
          {copy.listeningLoadError}
        </Text>
      </View>
    );
  if (!challenge) return null;

  return (
    <View style={styles.screen}>
      {backButton}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{copy.listeningEyebrow}</Text>
        <Text style={styles.heroTitle}>{copy.listeningTitle}</Text>
        <Text style={styles.heroText}>{copy.listeningDescription}</Text>
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
            accessibilityRole="button"
            accessibilityLabel={copy.listeningPlay}
            style={styles.playButton}
            onPress={() => void playPrompt()}
          >
            <Text style={styles.playIcon}>▶</Text>
          </Pressable>
          <View style={styles.playerBody}>
            <Text style={styles.playerLabel}>{copy.listeningPlay}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.slower}
            onPress={() => void playPrompt(true)}
          >
            <Text style={styles.slower}>
              0.75×{`\n`}
              {copy.slower}
            </Text>
          </Pressable>
        </View>

        {challenge.options.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="radio"
            accessibilityLabel={option.text}
            accessibilityState={{
              checked: selected === option.id,
              disabled: Boolean(result),
            }}
            disabled={Boolean(result)}
            onPress={() => {
              setSelected(option.id);
              setAttemptKey(`${challenge.id}:${Date.now()}`);
              setActionError(null);
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
              {result.correct ? copy.listeningCorrect : copy.listeningIncorrect}
            </Text>
            <Text style={styles.transcriptLabel}>
              {copy.listeningTranscript}
            </Text>
            <Text style={styles.transcript}>{result.transcript}</Text>
            <Text style={styles.explanation}>{result.explanation}</Text>
          </View>
        ) : null}

        {actionError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {actionError}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={result ? copy.nextChallenge : copy.listeningCheck}
          accessibilityState={{ disabled: !selected || busy }}
          style={[styles.primary, (!selected || busy) && styles.disabled]}
          disabled={!selected || busy}
          onPress={() => void (result ? next() : submit())}
        >
          <Text style={styles.primaryText}>
            {result ? copy.nextChallenge : copy.listeningCheck}
          </Text>
        </Pressable>
      </View>

      {speakingEnabled ? (
        <View style={styles.card}>
          <Text style={styles.challengeTitle}>{copy.listeningRecord}</Text>
          <Text style={styles.privacy}>{copy.listeningRecordingNotice}</Text>
          {recorderState.isRecording ? (
            <View style={styles.recordingBox}>
              <Text style={styles.recordingLabel}>
                {copy.listeningRecording} {elapsed}s
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.listeningStop}
                style={styles.stopButton}
                onPress={() => void stopRecording()}
              >
                <View style={styles.stopIcon} />
              </Pressable>
              <Text style={styles.recordingLabel}>{copy.listeningStop}</Text>
            </View>
          ) : (
            <View style={styles.recordActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.listeningRecord}
                style={styles.recordButton}
                onPress={() => void startRecording()}
              >
                <View style={styles.recordDot} />
                <Text style={styles.recordText}>{copy.listeningRecord}</Text>
              </Pressable>
              {recordingUri ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.listeningReplay}
                    style={styles.replayButton}
                    onPress={replayRecording}
                  >
                    <Text style={styles.replayText}>
                      ▶ {copy.listeningReplay}{" "}
                      {elapsed > 0 ? `${elapsed}s` : ""}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={copy.listeningDiscard}
                    onPress={() => void discardRecording()}
                  >
                    <Text style={styles.discard}>{copy.listeningDiscard}</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          )}
          {microphoneError ? (
            <Text style={styles.error}>{copy.listeningPermission}</Text>
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
    color: colors.accentCyan,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.2,
  },
  heroTitle: {
    ...typography.heading,
    color: colors.textInverse,
    fontSize: 26,
    lineHeight: 31,
  },
  heroText: { ...typography.body, color: colors.textOnInverseMuted },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing[2],
  },
  heroPill: {
    ...typography.title,
    color: colors.backgroundInverse,
    backgroundColor: colors.accentCyan,
    borderRadius: 999,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    fontSize: 12,
    lineHeight: 16,
  },
  heroCount: {
    ...typography.title,
    color: colors.textInverse,
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
  playIcon: { color: colors.textInverse, fontSize: 16, marginLeft: 2 },
  playerBody: { flex: 1, gap: spacing[1] },
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
    backgroundColor: colors.surfaceBlueRaised,
  },
  optionText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "700",
  },
  optionTextSelected: { color: colors.actionPrimary },
  feedback: { borderRadius: radii.lg, padding: spacing[3], gap: spacing[2] },
  success: { backgroundColor: colors.surfaceTeal },
  warning: { backgroundColor: colors.surfaceAmber },
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
  primaryText: { ...typography.title, color: colors.textInverse },
  disabled: { opacity: 0.45 },
  privacy: { ...typography.body, color: colors.textSecondary, fontSize: 12 },
  recordingBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: colors.surfaceRoseDeep,
    borderColor: colors.borderRose,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  recordingLabel: { ...typography.title, color: colors.accentRedDeep },
  stopButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accentRed,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 6,
    borderColor: colors.borderRose,
  },
  stopIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: colors.backgroundCard,
  },
  recordActions: { gap: spacing[2] },
  recordButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRoseDeep,
    borderWidth: 1,
    borderColor: colors.borderRose,
  },
  recordDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accentRed,
  },
  recordText: { ...typography.title, color: colors.accentRedDeep },
  replayButton: {
    minHeight: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceBlueRaised,
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
