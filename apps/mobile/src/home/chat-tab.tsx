import { useEffect, useState, type RefObject } from "react";
import {
  ActivityIndicator,
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
} from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { idempotencyKey } from "../api";
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

/** Reveals the assistant's reply chunk by chunk so it feels like a live conversation. */
function revealTyping(
  chunks: string[],
  setTyping: (value: { chunks: string[]; revealed: number } | null) => void,
): Promise<void> {
  return new Promise((resolve) => {
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
}

export function ChatTab({
  token,
  locale,
  language,
  copy,
  scrollRef,
  onActionError,
  voiceEnabled,
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  copy: TranslationMap;
  scrollRef: RefObject<ScrollView | null>;
  onActionError: () => void;
  voiceEnabled: boolean;
}) {
  const queryClient = useQueryClient();
  const scenariosQuery = useScenarios(token, language);
  const startConversationMutation = useStartConversation(token);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationQuery = useConversation(token, conversationId);
  const sendMessageMutation = useSendMessage(token, conversationId ?? "");
  const sendVoiceMutation = useSendVoiceMessage(token, conversationId ?? "");
  const completeConversationMutation = useCompleteConversation(
    token,
    conversationId ?? "",
  );
  const reportConversationMutation = useReportConversation(
    token,
    conversationId ?? "",
  );
  const conversation = conversationQuery.data;

  const [scenarioId, setScenarioId] = useState("");
  const [mode, setMode] = useState<CorrectionMode>("important_only");
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [message, setMessage] = useState("");
  const [pendingTurnKey, setPendingTurnKey] = useState("");
  const [pendingConversationKey, setPendingConversationKey] = useState("");
  const [typing, setTyping] = useState<{
    chunks: string[];
    revealed: number;
  } | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [microphoneError, setMicrophoneError] = useState(false);
  // HIGH_QUALITY uses MPEG-4/AAC on Android and iOS. LOW_QUALITY produces
  // 3GP/AMR on Android, which cannot truthfully be uploaded as audio/m4a.
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
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [scrollRef, conversation?.messages.length, typing]);

  const startConversation = () => {
    if (!scenarioId || startConversationMutation.isPending) return;
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
    setSummary(null);
    startConversationMutation.mutate(
      {
        language,
        scenarioId,
        correctionMode: mode,
        idempotencyKey: requestKey,
      },
      {
        onSuccess: (session) => {
          queryClient.setQueryData(
            ["growth", "conversation", token, session.id],
            session,
          );
          setConversationId(session.id);
          setPendingConversationKey("");
        },
        onError: onActionError,
      },
    );
  };

  const send = () => {
    if (
      !conversationId ||
      !message.trim() ||
      sendMessageMutation.isPending ||
      sendVoiceMutation.isPending ||
      typing
    )
      return;
    const learnerText = message.trim();
    const turnKey =
      pendingTurnKey || `conversation:${conversationId}:${Date.now()}`;
    setPendingTurnKey(turnKey);
    setMessage("");
    sendMessageMutation.mutate(
      { text: learnerText, idempotencyKey: turnKey },
      {
        onSuccess: async (turn) => {
          await revealTyping(turn.chunks, setTyping);
          await conversationQuery.refetch();
          setPendingTurnKey("");
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
    if (
      !conversationId ||
      !recordingUri ||
      sendMessageMutation.isPending ||
      sendVoiceMutation.isPending ||
      typing
    )
      return;
    try {
      const audioBase64 = await recordingToBase64(recordingUri);
      const turnKey =
        pendingTurnKey || `conversation:${conversationId}:voice:${Date.now()}`;
      setPendingTurnKey(turnKey);
      sendVoiceMutation.mutate(
        {
          audioBase64,
          mimeType: Platform.OS === "web" ? "audio/webm" : "audio/m4a",
          idempotencyKey: turnKey,
        },
        {
          onSuccess: async (response) => {
            setMessage(response.transcript);
            await revealTyping(response.turn.chunks, setTyping);
            await conversationQuery.refetch();
            await discardRecording();
            setMessage("");
            setPendingTurnKey("");
            setTyping(null);
          },
          onError: onActionError,
        },
      );
    } catch {
      onActionError();
    }
  };

  const complete = () => {
    if (!conversationId || completeConversationMutation.isPending) return;
    completeConversationMutation.mutate(locale, {
      onSuccess: setSummary,
      onError: onActionError,
    });
  };

  const busy =
    startConversationMutation.isPending ||
    sendMessageMutation.isPending ||
    sendVoiceMutation.isPending ||
    completeConversationMutation.isPending ||
    reportConversationMutation.isPending;
  const turnBusy =
    sendMessageMutation.isPending ||
    sendVoiceMutation.isPending ||
    Boolean(typing);

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{copy.chat}</Text>
      {!conversation ? (
        <>
          <Text style={styles.sectionLabel}>{copy.scenarios}</Text>
          {scenariosQuery.isLoading ? (
            <ActivityIndicator color={colors.actionPrimary} />
          ) : null}
          {scenariosQuery.isError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {copy.noData}
            </Text>
          ) : null}
          {(scenariosQuery.data ?? []).map((scenario) => (
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
                <Text style={styles.eyebrow}>
                  {scenario.category === "it"
                    ? copy.scenarioIt
                    : scenario.category === "business"
                      ? copy.scenarioBusiness
                      : copy.scenarioEveryday}
                </Text>
                <Text style={styles.cardTitle}>{scenario.title}</Text>
                <Text style={styles.cardDetail}>
                  {scenario.description} · {copy.levelLabel} {scenario.level} ·{" "}
                  {scenario.estimatedMinutes} {copy.minutesShort}
                </Text>
              </View>
              <Text style={styles.radio}>
                {scenarioId === scenario.id ? "●" : "○"}
              </Text>
            </Pressable>
          ))}
          <Text style={styles.sectionLabel}>{copy.correction}</Text>
          {correctionModes.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityLabel={copy[correctionLabelKey[item]]}
              accessibilityState={{ checked: mode === item }}
              style={styles.mode}
              onPress={() => {
                setMode(item);
                setPendingConversationKey("");
              }}
            >
              <Text style={styles.cardDetail}>
                {copy[correctionLabelKey[item]]}
              </Text>
              <Text style={styles.radio}>{mode === item ? "●" : "○"}</Text>
            </Pressable>
          ))}
          <PrimaryButton
            label={copy.startConversation}
            onPress={startConversation}
            disabled={startConversationMutation.isPending || !scenarioId}
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
            <View key={`${item.original}-${index}`} style={styles.correction}>
              <Text style={styles.original}>{item.original}</Text>
              <Text style={styles.corrected}>{item.corrected}</Text>
              <Text style={styles.cardDetail}>{item.explanation}</Text>
            </View>
          ))}
          <PrimaryButton
            label={copy.startConversation}
            onPress={() => {
              setConversationId(null);
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
              accessibilityState={{
                disabled: reportConversationMutation.isPending,
              }}
              disabled={reportConversationMutation.isPending}
              onPress={() => reportConversationMutation.mutate()}
            >
              <Text style={styles.report}>{copy.report}</Text>
            </Pressable>
          </View>
          {conversation.messages.length === 0 ? (
            <View style={styles.assistantBubble}>
              <Text style={styles.assistantText}>
                {conversation.scenario.openingLine}
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
            {voiceEnabled ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  recorderState.isRecording ? copy.voiceStop : copy.voiceRecord
                }
                accessibilityState={{ disabled: turnBusy }}
                disabled={turnBusy}
                style={styles.send}
                onPress={() =>
                  void (recorderState.isRecording
                    ? stopRecording()
                    : startRecording())
                }
              >
                <Text style={styles.sendText}>
                  {recorderState.isRecording ? "■" : "🎙"}
                </Text>
              </Pressable>
            ) : null}
            <TextInput
              accessibilityLabel={copy.chat}
              value={message}
              onChangeText={(value) => {
                setMessage(value);
                if (value.trim() !== message.trim()) setPendingTurnKey("");
              }}
              placeholder={copy.messagePlaceholder}
              placeholderTextColor={colors.textPlaceholder}
              multiline
              maxLength={800}
              editable={!turnBusy}
              style={styles.messageInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.send}
              accessibilityState={{
                disabled: turnBusy || !message.trim(),
              }}
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
            <Text style={styles.cardDetail}>{copy.voiceUploadNotice}</Text>
          ) : null}
          {recorderState.isRecording ? (
            <Text style={styles.cardDetail}>
              {copy.voiceRecording} ·{" "}
              {Math.round(recorderState.durationMillis / 1000)}s
            </Text>
          ) : null}
          {recordingUri && !recorderState.isRecording ? (
            <View style={styles.mode}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.voiceSend}
                accessibilityState={{ disabled: turnBusy }}
                disabled={turnBusy}
                onPress={() => void sendVoice()}
              >
                <Text style={styles.finish}>{copy.voiceSend}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.listeningDiscard}
                accessibilityState={{ disabled: turnBusy }}
                disabled={turnBusy}
                onPress={() => void discardRecording()}
              >
                <Text style={styles.cardDetail}>{copy.listeningDiscard}</Text>
              </Pressable>
            </View>
          ) : null}
          {microphoneError ? (
            <Text style={styles.original}>{copy.listeningPermission}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.finishConversation}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={complete}
          >
            <Text style={styles.finish}>{copy.finishConversation}</Text>
          </Pressable>
        </>
      )}
      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}
