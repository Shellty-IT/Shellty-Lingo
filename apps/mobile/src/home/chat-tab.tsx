import { useEffect, useMemo, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
  type ScrollView,
} from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ConversationSummary,
  CorrectionMode,
  CourseLanguage,
  VoiceConversationTurnResponse,
} from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { ApiRequestError, idempotencyKey } from "../api";
import { discardLocalRecording, recordingToBase64 } from "../local-recording";
import {
  useCompleteConversation,
  useConversation,
  useReportConversation,
  useScenarios,
  useSendMessage,
  useSendVoiceMessage,
  useStartConversation,
} from "../queries/growth";
import { sendTelemetry } from "../queries/release";
import { StatePanel } from "../ui/state-panel";
import { conversationProgress } from "./conversation-presentation";
import { PrimaryButton } from "./shared";
import { styles } from "./styles";

const correctionModes: CorrectionMode[] = [
  "after_each_message",
  "important_only",
  "after_conversation",
  "no_corrections",
];

const correctionLabelKey: Record<CorrectionMode, keyof TranslationMap> = {
  after_each_message: "correctionAfterEach",
  important_only: "correctionImportantOnly",
  after_conversation: "correctionAfterConversation",
  no_corrections: "correctionNoCorrections",
};

const correctionDetailKey: Record<CorrectionMode, keyof TranslationMap> = {
  after_each_message: "correctionAfterEachDetail",
  important_only: "correctionImportantOnlyDetail",
  after_conversation: "correctionAfterConversationDetail",
  no_corrections: "correctionNoCorrectionsDetail",
};

function revealTyping(
  chunks: string[],
  setTyping: (value: { chunks: string[]; revealed: number } | null) => void,
): Promise<void> {
  return new Promise((resolve) => {
    if (chunks.length === 0) return resolve();
    setTyping({ chunks, revealed: 1 });
    let revealed = 1;
    const interval = setInterval(() => {
      revealed += 1;
      if (revealed >= chunks.length) {
        clearInterval(interval);
        resolve();
      } else setTyping({ chunks, revealed });
    }, 160);
  });
}

export function ChatTab({
  token,
  locale,
  language,
  copy,
  scrollRef,
  onActionError,
  voiceEnabled,
  onFocusedChange,
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  copy: TranslationMap;
  scrollRef: RefObject<ScrollView | null>;
  onActionError: () => void;
  voiceEnabled: boolean;
  onFocusedChange: (focused: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const scenariosQuery = useScenarios(token, language);
  const startMutation = useStartConversation(token);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationQuery = useConversation(token, conversationId);
  const sendMutation = useSendMessage(token, conversationId ?? "");
  const voiceMutation = useSendVoiceMessage(token, conversationId ?? "");
  const completeMutation = useCompleteConversation(token, conversationId ?? "");
  const reportMutation = useReportConversation(token, conversationId ?? "");
  const conversation = conversationQuery.data;

  const [scenarioId, setScenarioId] = useState("");
  const [mode, setMode] = useState<CorrectionMode>("important_only");
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [turnKey, setTurnKey] = useState("");
  const [startKey, setStartKey] = useState("");
  const [typing, setTyping] = useState<{
    chunks: string[];
    revealed: number;
  } | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [microphoneError, setMicrophoneError] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const [voiceAssessment, setVoiceAssessment] = useState<{
    transcript: string;
    assessment: VoiceConversationTurnResponse["assessment"];
  } | null>(null);
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

  useEffect(
    () => () => {
      if (recordingUri) void discardLocalRecording(recordingUri);
    },
    [recordingUri],
  );
  useEffect(() => {
    if (!scenarioId && scenariosQuery.data?.[0])
      setScenarioId(scenariosQuery.data[0].id);
  }, [scenarioId, scenariosQuery.data]);
  useEffect(() => {
    onFocusedChange(Boolean(conversationId));
    return () => onFocusedChange(false);
  }, [conversationId, onFocusedChange]);
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [scrollRef, conversation?.messages.length, typing]);

  const selectedScenario = useMemo(
    () => scenariosQuery.data?.find((item) => item.id === scenarioId),
    [scenarioId, scenariosQuery.data],
  );
  const progress = conversation ? conversationProgress(conversation) : null;
  const limitReached = progress?.limitReached ?? false;
  const turnBusy =
    sendMutation.isPending || voiceMutation.isPending || Boolean(typing);
  const busy =
    startMutation.isPending ||
    turnBusy ||
    completeMutation.isPending ||
    reportMutation.isPending;

  const resetConversation = async () => {
    if (recorderState.isRecording) await recorder.stop().catch(() => undefined);
    if (recordingUri)
      await discardLocalRecording(recordingUri).catch(() => undefined);
    setRecordingUri(null);
    setMessage("");
    setTyping(null);
    setTurnKey("");
    setConversationId(null);
    setSummary(null);
    setReported(false);
    setFallbackActive(false);
    setVoiceAssessment(null);
    setVoiceError(null);
  };

  const requestExit = () => {
    if (summary) return void resetConversation();
    Alert.alert(copy.exitConversationTitle, copy.exitConversationBody, [
      { text: copy.keepTalking, style: "cancel" },
      {
        text: copy.exitConversation,
        style: "destructive",
        onPress: () => void resetConversation(),
      },
    ]);
  };

  const startConversation = () => {
    if (!scenarioId || startMutation.isPending) return;
    const key =
      startKey ||
      idempotencyKey(
        "conversation-start",
        language,
        scenarioId,
        mode,
        Date.now().toString(),
      );
    setStartKey(key);
    startMutation.mutate(
      { language, scenarioId, correctionMode: mode, idempotencyKey: key },
      {
        onSuccess: (session) => {
          queryClient.setQueryData(
            ["growth", "conversation", token, session.id],
            session,
          );
          setConversationId(session.id);
          setStartKey("");
          sendTelemetry(token, "conversation_started", {
            language,
            scenarioId,
            correctionMode: mode,
          });
        },
        onError: onActionError,
      },
    );
  };

  const send = () => {
    if (!conversationId || !message.trim() || turnBusy || limitReached) return;
    const learnerText = message.trim();
    const key = turnKey || `conversation:${conversationId}:${Date.now()}`;
    setTurnKey(key);
    setMessage("");
    sendMutation.mutate(
      { text: learnerText, idempotencyKey: key },
      {
        onSuccess: async (turn) => {
          setFallbackActive(turn.generatedBy === "fallback");
          setVoiceAssessment(null);
          await revealTyping(turn.chunks, setTyping);
          await conversationQuery.refetch();
          setTurnKey("");
          setTyping(null);
        },
        onError: () => {
          setMessage(learnerText);
          setTyping(null);
          onActionError();
        },
      },
    );
  };

  const startRecording = async () => {
    setMicrophoneError(false);
    setVoiceError(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return setMicrophoneError(true);
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

  const discardRecording = async () => {
    try {
      if (recordingUri) await discardLocalRecording(recordingUri);
    } catch {
      onActionError();
    } finally {
      setRecordingUri(null);
    }
  };

  const sendVoice = async () => {
    if (!conversationId || !recordingUri || turnBusy || limitReached) return;
    try {
      const audioBase64 = await recordingToBase64(recordingUri);
      const key =
        turnKey || `conversation:${conversationId}:voice:${Date.now()}`;
      setTurnKey(key);
      voiceMutation.mutate(
        {
          audioBase64,
          mimeType: Platform.OS === "web" ? "audio/webm" : "audio/m4a",
          idempotencyKey: key,
        },
        {
          onSuccess: async (response) => {
            setFallbackActive(response.turn.generatedBy === "fallback");
            setVoiceAssessment({
              transcript: response.transcript,
              assessment: response.assessment,
            });
            await revealTyping(response.turn.chunks, setTyping);
            await conversationQuery.refetch();
            await discardRecording();
            setTurnKey("");
            setTyping(null);
          },
          onError: (error) => {
            if (
              error instanceof ApiRequestError &&
              error.code === "VOICE_NOT_UNDERSTOOD"
            )
              setVoiceError(copy.voiceNeedsAttention);
            else onActionError();
          },
        },
      );
    } catch {
      onActionError();
    }
  };

  const complete = () => {
    if (!conversationId || completeMutation.isPending || !progress?.canFinish)
      return;
    completeMutation.mutate(locale, {
      onSuccess: (result) => {
        setSummary(result);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      },
      onError: onActionError,
    });
  };

  if (conversationId && conversationQuery.isLoading) {
    return (
      <View style={styles.section}>
        <StatePanel
          kind="loading"
          title={copy.loading}
          body={copy.scenarioLoadingBody}
        />
      </View>
    );
  }

  if (conversationId && conversationQuery.isError) {
    return (
      <View style={styles.section}>
        <StatePanel
          kind="error"
          title={copy.conversationLoadErrorTitle}
          body={copy.conversationLoadErrorBody}
          actionLabel={copy.retry}
          onAction={() => void conversationQuery.refetch()}
        />
        <Pressable accessibilityRole="button" onPress={requestExit}>
          <Text style={styles.finish}>{copy.exitConversation}</Text>
        </Pressable>
      </View>
    );
  }

  if (!conversation) {
    return (
      <View style={styles.section}>
        <View style={styles.practiceHero}>
          <Text style={styles.eyebrow}>{copy.practiceEyebrow}</Text>
          <Text style={styles.heroTitle}>{copy.practiceTitle}</Text>
          <Text style={styles.heroText}>{copy.practiceBody}</Text>
          <Text style={styles.practiceTrust}>
            ✦ {copy.aiConversationNotice}
          </Text>
        </View>
        <Text style={styles.sectionLabel}>{copy.scenarios}</Text>
        {scenariosQuery.isLoading ? (
          <StatePanel
            kind="loading"
            title={copy.scenarioLoading}
            body={copy.scenarioLoadingBody}
          />
        ) : null}
        {scenariosQuery.isError ? (
          <StatePanel
            kind="error"
            title={copy.scenarioErrorTitle}
            body={copy.scenarioErrorBody}
            actionLabel={copy.retry}
            onAction={() => void scenariosQuery.refetch()}
          />
        ) : null}
        {!scenariosQuery.isLoading &&
        !scenariosQuery.isError &&
        scenariosQuery.data?.length === 0 ? (
          <StatePanel
            kind="empty"
            title={copy.scenarioEmptyTitle}
            body={copy.scenarioEmptyBody}
          />
        ) : null}
        {(scenariosQuery.data ?? []).map((scenario) => (
          <Pressable
            key={scenario.id}
            accessibilityRole="radio"
            accessibilityLabel={`${scenario.title}. ${scenario.description}`}
            accessibilityState={{ checked: scenarioId === scenario.id }}
            style={[
              styles.scenarioCard,
              scenarioId === scenario.id && styles.choiceActive,
            ]}
            onPress={() => {
              setScenarioId(scenario.id);
              setStartKey("");
            }}
          >
            <View style={styles.scenarioTopRow}>
              <Text style={styles.scenarioCategory}>
                {scenario.category === "it"
                  ? copy.scenarioIt
                  : scenario.category === "business"
                    ? copy.scenarioBusiness
                    : copy.scenarioEveryday}
              </Text>
              <Text style={styles.scenarioMeta}>
                {scenario.level} · {scenario.estimatedMinutes}{" "}
                {copy.minutesShort}
              </Text>
            </View>
            <View style={styles.scenarioContent}>
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>{scenario.title}</Text>
                <Text style={styles.cardDetail}>{scenario.description}</Text>
                <Text style={styles.scenarioRole}>
                  {copy.aiRole}: {scenario.role}
                </Text>
              </View>
              <Text style={styles.radio}>
                {scenarioId === scenario.id ? "●" : "○"}
              </Text>
            </View>
          </Pressable>
        ))}
        <Text style={styles.sectionLabel}>{copy.correction}</Text>
        <Text style={styles.sectionHint}>{copy.correctionHint}</Text>
        {correctionModes.map((item) => (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityLabel={`${copy[correctionLabelKey[item]]}. ${copy[correctionDetailKey[item]]}`}
            accessibilityState={{ checked: mode === item }}
            style={[
              styles.correctionMode,
              mode === item && styles.correctionModeActive,
            ]}
            onPress={() => {
              setMode(item);
              setStartKey("");
            }}
          >
            <View style={styles.grow}>
              <Text style={styles.cardTitle}>
                {copy[correctionLabelKey[item]]}
              </Text>
              <Text style={styles.cardDetail}>
                {copy[correctionDetailKey[item]]}
              </Text>
            </View>
            <Text style={styles.radio}>{mode === item ? "●" : "○"}</Text>
          </Pressable>
        ))}
        {selectedScenario ? (
          <View style={styles.startSummary}>
            <Text style={styles.startSummaryLabel}>{copy.readyToTalk}</Text>
            <Text style={styles.startSummaryText}>
              {selectedScenario.title} · {copy[correctionLabelKey[mode]]}
            </Text>
          </View>
        ) : null}
        <PrimaryButton
          label={copy.startConversation}
          onPress={startConversation}
          disabled={startMutation.isPending || !scenarioId}
        />
        {startMutation.isPending ? (
          <Text accessibilityLiveRegion="polite" style={styles.sectionHint}>
            {copy.startingConversation}
          </Text>
        ) : null}
      </View>
    );
  }

  if (summary) {
    return (
      <View style={styles.section}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.backToPractice}
          onPress={() => void resetConversation()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹ {copy.backToPractice}</Text>
        </Pressable>
        <View accessibilityRole="summary" style={styles.conversationSummary}>
          <View style={styles.summaryGlyph}>
            <Text style={styles.summaryGlyphText}>✓</Text>
          </View>
          <Text style={styles.eyebrow}>{copy.conversationComplete}</Text>
          <Text style={styles.summaryTitle}>{summary.headline}</Text>
          <Text style={styles.summaryRecommendation}>
            {summary.recommendation}
          </Text>
        </View>
        {summary.strengths.length > 0 ? (
          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>
              {copy.conversationStrengths}
            </Text>
            {summary.strengths.map((strength, index) => (
              <View key={`${strength}-${index}`} style={styles.summaryRow}>
                <Text style={styles.summaryRowGlyph}>✓</Text>
                <Text style={styles.summaryRowText}>{strength}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.summarySection}>
          <Text style={styles.sectionLabel}>
            {copy.conversationCorrections}
          </Text>
          {summary.corrections.length === 0 ? (
            <Text style={styles.cardDetail}>
              {copy.noConversationCorrections}
            </Text>
          ) : (
            summary.corrections.map((item, index) => (
              <View key={`${item.original}-${index}`} style={styles.correction}>
                <Text style={styles.original}>{item.original}</Text>
                <Text style={styles.corrected}>✓ {item.corrected}</Text>
                <Text style={styles.cardDetail}>{item.explanation}</Text>
              </View>
            ))
          )}
        </View>
        {summary.newWords.length > 0 ? (
          <View style={styles.summarySection}>
            <Text style={styles.sectionLabel}>{copy.newConversationWords}</Text>
            <View style={styles.wordGrid}>
              {summary.newWords.map((item) => (
                <View
                  key={`${item.term}-${item.translation}`}
                  style={styles.wordCard}
                >
                  <Text style={styles.cardTitle}>{item.term}</Text>
                  <Text style={styles.cardDetail}>{item.translation}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        <View style={styles.nextPracticeCard}>
          <Text style={styles.sectionLabel}>{copy.recommendedNext}</Text>
          <Text style={styles.cardTitle}>{summary.recommendation}</Text>
        </View>
        <PrimaryButton
          label={copy.chooseAnotherScenario}
          onPress={() => void resetConversation()}
        />
      </View>
    );
  }

  return (
    <View style={styles.conversationShell}>
      <View style={styles.focusedTopBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.exitConversation}
          onPress={requestExit}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹ {copy.exitConversation}</Text>
        </Pressable>
        <View style={styles.messageBudget}>
          <Text style={styles.messageBudgetValue}>
            {conversation.remainingMessages}
          </Text>
          <Text style={styles.messageBudgetLabel}>
            {copy.messagesLeftShort}
          </Text>
        </View>
      </View>
      <View style={styles.conversationGoal}>
        <Text style={styles.eyebrow}>{copy.conversationGoal}</Text>
        <Text style={styles.cardTitle}>{conversation.scenario.title}</Text>
        <Text style={styles.cardDetail}>
          {conversation.scenario.description}
        </Text>
        <Text style={styles.scenarioRole}>
          {copy.aiRole}: {conversation.scenario.role}
        </Text>
      </View>
      <View style={styles.chatHeader}>
        <Text style={styles.sectionLabel}>{copy.liveConversation}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.report}
          accessibilityState={{
            disabled: reportMutation.isPending || reported,
          }}
          disabled={reportMutation.isPending || reported}
          onPress={() =>
            reportMutation.mutate(undefined, {
              onSuccess: () => setReported(true),
              onError: onActionError,
            })
          }
        >
          <Text style={styles.report}>
            {reported ? copy.reported : copy.report}
          </Text>
        </Pressable>
      </View>
      <View style={styles.messageGroup}>
        <Text style={styles.messageRole}>{copy.aiTutor}</Text>
        <View style={styles.assistantBubble}>
          <Text style={styles.assistantText}>
            {conversation.scenario.openingLine}
          </Text>
        </View>
      </View>
      {conversation.messages.map((item) => (
        <View
          key={item.id}
          style={[
            styles.messageGroup,
            item.role === "learner" && styles.learnerMessageGroup,
          ]}
        >
          <Text style={styles.messageRole}>
            {item.role === "learner" ? copy.you : copy.aiTutor}
          </Text>
          <View
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
          </View>
          {item.correction ? (
            <View style={styles.inlineCorrection}>
              <Text style={styles.correctionEyebrow}>
                {copy.quickCorrection}
              </Text>
              <Text style={styles.original}>{item.correction.original}</Text>
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
        <View
          accessibilityLiveRegion="polite"
          accessibilityLabel={copy.aiIsReplying}
          style={styles.messageGroup}
        >
          <Text style={styles.messageRole}>{copy.aiTutor}</Text>
          <View style={[styles.bubble, styles.assistantBubble]}>
            <Text style={styles.assistantText}>
              {typing.chunks.slice(0, typing.revealed).join(" ")}
            </Text>
            <Text style={styles.typingIndicator}>•••</Text>
          </View>
        </View>
      ) : null}
      {limitReached ? (
        <StatePanel
          kind="success"
          title={copy.conversationLimitTitle}
          body={copy.conversationLimitBody}
          actionLabel={
            progress?.canFinish ? copy.showConversationSummary : undefined
          }
          onAction={progress?.canFinish ? complete : undefined}
        />
      ) : (
        <View style={styles.composerArea}>
          <View style={styles.composer}>
            {voiceEnabled ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  recorderState.isRecording ? copy.voiceStop : copy.voiceRecord
                }
                accessibilityState={{ disabled: turnBusy }}
                disabled={turnBusy}
                style={[styles.send, turnBusy && styles.sendDisabled]}
                onPress={() =>
                  void (recorderState.isRecording
                    ? stopRecording()
                    : startRecording())
                }
              >
                <Text style={styles.sendText}>
                  {recorderState.isRecording ? "■" : "●"}
                </Text>
              </Pressable>
            ) : null}
            <TextInput
              accessibilityLabel={copy.messagePlaceholder}
              value={message}
              onChangeText={(value) => {
                setMessage(value);
                if (value.trim() !== message.trim()) setTurnKey("");
              }}
              placeholder={copy.messagePlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              multiline
              maxLength={800}
              editable={!turnBusy}
              style={styles.messageInput}
              onFocus={() => {
                setTimeout(
                  () => scrollRef.current?.scrollToEnd({ animated: true }),
                  250,
                );
              }}
              onSubmitEditing={send}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.send}
              accessibilityState={{ disabled: turnBusy || !message.trim() }}
              disabled={turnBusy || !message.trim()}
              style={[
                styles.send,
                (turnBusy || !message.trim()) && styles.sendDisabled,
              ]}
              onPress={send}
            >
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
          {voiceEnabled ? (
            <Text style={styles.privacyHint}>{copy.voiceUploadNotice}</Text>
          ) : null}
          {fallbackActive ? (
            <Text accessibilityRole="alert" style={styles.fallbackNotice}>
              {copy.aiFallbackNotice}
            </Text>
          ) : null}
          {voiceAssessment ? (
            <View style={styles.voiceAssessment}>
              <Text style={styles.correctionEyebrow}>
                {copy.voiceTranscriptLabel}
              </Text>
              <Text style={styles.assistantText}>
                “{voiceAssessment.transcript}”
              </Text>
              <Text style={styles.cardDetail}>
                {voiceAssessment.assessment.status === "understood"
                  ? copy.voiceUnderstood
                  : copy.voiceNeedsAttention}
              </Text>
            </View>
          ) : null}
          {recorderState.isRecording ? (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.recordingStatus}
            >
              ● {copy.voiceRecording} ·{" "}
              {Math.round(recorderState.durationMillis / 1000)}s
            </Text>
          ) : null}
          {recordingUri && !recorderState.isRecording ? (
            <View style={styles.recordingActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.voiceSend}
                disabled={turnBusy}
                onPress={() => void sendVoice()}
              >
                <Text style={styles.finish}>{copy.voiceSend}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.listeningDiscard}
                disabled={turnBusy}
                onPress={() => void discardRecording()}
              >
                <Text style={styles.cardDetail}>{copy.listeningDiscard}</Text>
              </Pressable>
            </View>
          ) : null}
          {microphoneError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {copy.listeningPermission}
            </Text>
          ) : null}
          {voiceError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {voiceError}
            </Text>
          ) : null}
        </View>
      )}
      {!limitReached ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            progress?.canFinish
              ? copy.showConversationSummary
              : copy.finishAfterFirstMessage
          }
          accessibilityState={{ disabled: busy || !progress?.canFinish }}
          disabled={busy || !progress?.canFinish}
          style={styles.finishButton}
          onPress={complete}
        >
          <Text
            style={[
              styles.finish,
              !progress?.canFinish && styles.finishDisabled,
            ]}
          >
            {progress?.canFinish
              ? copy.showConversationSummary
              : copy.finishAfterFirstMessage}
          </Text>
        </Pressable>
      ) : null}
      {busy ? (
        <ActivityIndicator
          accessibilityLabel={copy.loading}
          color={colors.actionPrimary}
        />
      ) : null}
    </View>
  );
}
