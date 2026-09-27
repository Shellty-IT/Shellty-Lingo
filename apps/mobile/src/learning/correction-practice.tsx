import { useEffect, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { ExerciseCorrectionResult } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { apiRequest, idempotencyKey } from "../api";
import { PrimaryButton, SmallButton } from "./shared";
import { styles } from "./styles";

export function CorrectionPractice({
  token,
  attemptId,
  copy,
  onBusy,
  onAnswerFocus,
}: {
  token: string;
  attemptId: string;
  copy: TranslationMap;
  onBusy: (busy: boolean) => void;
  onAnswerFocus?: (input?: TextInput | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [result, setResult] = useState<ExerciseCorrectionResult | null>(null);
  const frozen = useRef<{ answer: string; idempotencyKey: string } | null>(
    null,
  );
  const alive = useRef(true);
  const inFlight = useRef(false);
  const input = useRef<TextInput>(null);
  useEffect(() => {
    alive.current = true;
    void apiRequest<ExerciseCorrectionResult | null>(
      `/learning/attempts/${attemptId}/correction`,
      { token },
    )
      .then((saved) => {
        if (alive.current && saved) setResult(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive.current) setRestoring(false);
      });
    return () => {
      alive.current = false;
    };
  }, []);
  const submit = async () => {
    if (inFlight.current || !answer.trim()) return;
    frozen.current ??= {
      answer: answer.trim(),
      idempotencyKey: idempotencyKey("correction", attemptId),
    };
    inFlight.current = true;
    setBusy(true);
    onBusy(true);
    setError(false);
    try {
      const saved = await apiRequest<ExerciseCorrectionResult>(
        `/learning/attempts/${attemptId}/correction`,
        {
          method: "POST",
          token,
          body: frozen.current,
        },
      );
      if (alive.current) setResult(saved);
    } catch {
      if (alive.current) setError(true);
    } finally {
      inFlight.current = false;
      if (alive.current) {
        setBusy(false);
        onBusy(false);
      }
    }
  };
  return (
    <View style={styles.options}>
      {!open ? (
        <SmallButton
          label={copy.correctionAction}
          onPress={() => setOpen(true)}
        />
      ) : (
        <>
          <Text style={styles.detail}>{copy.correctionInstruction}</Text>
          {result ? (
            <Text accessibilityLiveRegion="polite" style={styles.detail}>
              {copy.correctionSaved}:{" "}
              {result.assessment.status === "needs_review"
                ? copy.assessmentUnresolved
                : result.correct
                  ? copy.correctAnswer
                  : copy.remember}
            </Text>
          ) : (
            <>
              <TextInput
                ref={input}
                onFocus={() => onAnswerFocus?.(input.current)}
                accessibilityLabel={copy.answerLabel}
                value={answer}
                onChangeText={setAnswer}
                style={styles.input}
                editable={!frozen.current && !restoring}
                autoCorrect={false}
                multiline
              />
              <PrimaryButton
                label={error ? copy.retry : copy.checkAnswer}
                onPress={() => void submit()}
                disabled={busy || restoring || !answer.trim()}
                loading={busy || restoring}
              />
              {error ? (
                <Text style={styles.detail}>{copy.learningError}</Text>
              ) : null}
            </>
          )}
        </>
      )}
    </View>
  );
}
