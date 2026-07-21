import { useEffect, useState, type RefObject } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type ScrollView,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type {
  ConversationSummary,
  CorrectionMode,
  CourseLanguage,
} from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { idempotencyKey } from "../api";
import {
  useCompleteConversation,
  useConversation,
  useReportConversation,
  useScenarios,
  useSendMessage,
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
}: {
  token: string;
  locale: Locale;
  language: CourseLanguage;
  copy: TranslationMap;
  scrollRef: RefObject<ScrollView | null>;
  onActionError: () => void;
}) {
  const queryClient = useQueryClient();
  const scenariosQuery = useScenarios(token, language);
  const startConversationMutation = useStartConversation(token);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversationQuery = useConversation(token, conversationId);
  const sendMessageMutation = useSendMessage(token, conversationId ?? "");
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

  useEffect(() => {
    if (!scenarioId && scenariosQuery.data?.[0])
      setScenarioId(scenariosQuery.data[0].id);
  }, [scenarioId, scenariosQuery.data]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [scrollRef, conversation?.messages.length, typing]);

  const startConversation = () => {
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
    if (!conversationId || !message.trim()) return;
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

  const complete = () => {
    if (!conversationId) return;
    completeConversationMutation.mutate(locale, {
      onSuccess: setSummary,
      onError: onActionError,
    });
  };

  const busy =
    startConversationMutation.isPending ||
    sendMessageMutation.isPending ||
    completeConversationMutation.isPending;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{copy.chat}</Text>
      {!conversation ? (
        <>
          <Text style={styles.sectionLabel}>{copy.scenarios}</Text>
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
              onPress={() => reportConversationMutation.mutate()}
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
              editable={!sendMessageMutation.isPending}
              style={styles.messageInput}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.send}
              accessibilityState={{
                disabled: sendMessageMutation.isPending || !message.trim(),
              }}
              disabled={sendMessageMutation.isPending || !message.trim()}
              style={[
                styles.send,
                (sendMessageMutation.isPending || !message.trim()) &&
                  styles.sendDisabled,
              ]}
              onPress={send}
            >
              <Text style={styles.sendText}>➤</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.finishConversation}
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
