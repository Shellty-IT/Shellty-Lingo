import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type {
  ReviewAssessment,
  ReviewQueueItem,
  ReviewRating,
} from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { speak, stopSpeech } from "../speech";
import { SpeechRateControl, type SpeechRate } from "../ui/speech-rate-control";
import { PrimaryButton, SmallButton } from "./shared";
import {
  expectedReviewAnswer,
  formatReviewInterval,
  reviewAnswerCorrect,
  reviewAnswerReady,
  reviewRatingsForAnswer,
} from "./review-presentation";
import { styles } from "./styles";

export function ReviewsView({
  reviews,
  copy,
  locale,
  onClose,
  onRate,
  onAssess,
  onAnswerFocus,
  disabled,
  pendingRating,
  onRetry,
  onSkip,
  batchTotal,
  remainingDue = 0,
  batchSize = 5,
  onNextBatch,
}: {
  reviews: ReviewQueueItem[];
  copy: TranslationMap;
  locale: Locale;
  onClose: () => void;
  onRate: (rating: ReviewRating) => void;
  onAssess: (itemId: string, answer: string) => Promise<ReviewAssessment>;
  onAnswerFocus: (input?: TextInput | null) => void;
  disabled: boolean;
  pendingRating?: ReviewRating;
  onRetry: () => void;
  onSkip?: () => void;
  batchTotal?: number;
  remainingDue?: number;
  batchSize?: 5 | 10;
  onNextBatch?: (size: 5 | 10) => void;
}) {
  const current = reviews[0];
  const currentAudioPrompt = current?.audioPrompt;
  const [selected, setSelected] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [speechRate, setSpeechRate] = useState<SpeechRate>(1);
  const [assessment, setAssessment] = useState<ReviewAssessment | null>(null);
  const [assessing, setAssessing] = useState(false);
  const [assessmentError, setAssessmentError] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const activeRequest = useRef(0);
  const answerInput = useRef<TextInput>(null);
  const assessmentInFlight = useRef(false);
  useEffect(
    () => () => {
      activeRequest.current++;
      void stopSpeech().catch(() => undefined);
    },
    [],
  );
  const selfAssess = current?.answer.mode === "self_assess";

  useEffect(() => {
    activeRequest.current++;
    assessmentInFlight.current = false;
    setAssessing(false);
    setSubmittedAnswer("");
    setSelected([]);
    setTypedAnswer("");
    setRevealed(false);
    setAudioError(false);
    setAssessment(null);
    setAssessmentError(false);
  }, [current?.id, current?.scheduleRevision]);

  const answerReady = current
    ? reviewAnswerReady(current.answer, typedAnswer, selected)
    : false;
  const exactCorrect = useMemo(
    () =>
      current
        ? reviewAnswerCorrect(
            current.answer,
            typedAnswer,
            selected,
            current.normalizationPolicy,
          )
        : false,
    [current, selected, typedAnswer],
  );
  const expectedAnswer = current ? expectedReviewAnswer(current.answer) : "";
  const verdict =
    assessment?.verdict ?? (exactCorrect ? "correct" : "incorrect");
  const correct = verdict === "correct";
  const partial = verdict === "almost";
  const unresolved = verdict === "needs_review" || assessmentError;
  const manualAssessment =
    selfAssess &&
    (!assessment || (!assessment.dynamic && !assessment.assessment));
  const submitAnswer = async () => {
    if (
      !current ||
      !answerReady ||
      disabled ||
      assessing ||
      assessmentInFlight.current ||
      pendingRating
    )
      return;
    const request = ++activeRequest.current;
    const submitted = typedAnswer.trim();
    setSubmittedAnswer(submitted);
    if (
      current.answer.mode === "text" ||
      current.answer.mode === "self_assess"
    ) {
      setAssessing(true);
      assessmentInFlight.current = true;
      setAssessmentError(false);
      try {
        const result = await onAssess(current.id, submitted);
        if (request !== activeRequest.current) return;
        setAssessment(result);
      } catch {
        if (request !== activeRequest.current) return;
        setAssessmentError(true);
      } finally {
        if (request === activeRequest.current) {
          assessmentInFlight.current = false;
          setAssessing(false);
        }
      }
    }
    if (request === activeRequest.current) setRevealed(true);
  };

  const toggleOption = (id: string) => {
    if (
      !current ||
      current.answer.mode === "text" ||
      current.answer.mode === "self_assess" ||
      revealed
    )
      return;
    if (current.answer.mode === "single_choice") {
      setSelected([id]);
      return;
    }
    setSelected((values) =>
      values.includes(id)
        ? values.filter((value) => value !== id)
        : [...values, id],
    );
  };

  return (
    <View style={styles.flow}>
      <View style={styles.courseHeader}>
        <Text style={styles.title}>{copy.reviews}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.dismiss}
          onPress={onClose}
          style={styles.close}
        >
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      {batchTotal !== undefined ? (
        <Text style={styles.detail}>
          {copy.reviewBatchProgress
            .replace("{completed}", String(batchTotal - reviews.length))
            .replace("{total}", String(batchTotal))}
        </Text>
      ) : null}
      {current ? (
        <>
          <View style={styles.promptCard}>
            <Text style={styles.prompt}>{current.sourceText}</Text>
            {currentAudioPrompt ? (
              <>
                <SmallButton
                  label={`🔊 ${copy.listen}`}
                  onPress={() => {
                    setAudioError(false);
                    void speak(
                      currentAudioPrompt.text,
                      currentAudioPrompt.language,
                      speechRate,
                    ).catch(() => setAudioError(true));
                  }}
                  disabled={disabled}
                />
                <SpeechRateControl
                  value={speechRate}
                  onChange={setSpeechRate}
                  disabled={disabled}
                />
                {audioError ? (
                  <Text style={styles.detail}>{copy.voiceUnavailable}</Text>
                ) : null}
              </>
            ) : null}
          </View>

          {pendingRating ? (
            <>
              <Text style={styles.detail}>
                {copy.reviewPendingRating}: {copy[pendingRating]}
              </Text>
              <PrimaryButton
                label={copy.retry}
                onPress={onRetry}
                disabled={disabled}
                loading={disabled}
              />
            </>
          ) : !revealed ? (
            <>
              <Text style={styles.reviewInstruction}>
                {copy.reviewAnswerInstruction}
              </Text>
              {current.answer.mode === "text" ||
              current.answer.mode === "self_assess" ? (
                <TextInput
                  ref={answerInput}
                  accessibilityLabel={copy.answerLabel}
                  style={styles.input}
                  value={typedAnswer}
                  onChangeText={setTypedAnswer}
                  placeholder={copy.answerPlaceholder}
                  placeholderTextColor={colors.textPlaceholder}
                  editable={!disabled && !assessing}
                  returnKeyType="done"
                  onFocus={() => onAnswerFocus(answerInput.current)}
                  onSubmitEditing={() => {
                    void submitAnswer();
                  }}
                />
              ) : (
                <View style={styles.options}>
                  {current.answer.options.map((option) => {
                    const isSelected = selected.includes(option.id);
                    return (
                      <Pressable
                        key={option.id}
                        accessibilityRole={
                          current.answer.mode === "multiple_choice"
                            ? "checkbox"
                            : "radio"
                        }
                        accessibilityLabel={option.text}
                        accessibilityState={{
                          checked: isSelected,
                          selected: isSelected,
                          disabled,
                        }}
                        disabled={disabled}
                        onPress={() => toggleOption(option.id)}
                        style={[
                          styles.option,
                          isSelected && styles.optionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionTitle,
                            isSelected && styles.optionSelectedText,
                          ]}
                        >
                          {current.answer.mode === "multiple_choice"
                            ? `${isSelected ? "☑" : "☐"} ${option.text}`
                            : option.text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <PrimaryButton
                label={copy.checkAnswer}
                onPress={() => void submitAnswer()}
                disabled={!answerReady || disabled || assessing}
              />
            </>
          ) : (
            <>
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={[
                  styles.feedbackPanel,
                  partial || unresolved
                    ? styles.feedbackPartial
                    : correct
                      ? styles.feedbackCorrect
                      : styles.feedbackIncorrect,
                ]}
              >
                <View style={styles.feedbackHeading}>
                  <View
                    style={[
                      styles.feedbackIcon,
                      partial || unresolved
                        ? styles.feedbackIconPartial
                        : correct
                          ? styles.feedbackIconCorrect
                          : styles.feedbackIconIncorrect,
                    ]}
                  >
                    <Text style={styles.feedbackIconText}>
                      {partial || unresolved ? "~" : correct ? "✓" : "!"}
                    </Text>
                  </View>
                  <Text style={styles.feedbackTitle}>
                    {unresolved
                      ? copy.assessmentUnresolved
                      : partial
                        ? copy.almostThere
                        : correct
                          ? copy.correctAnswer
                          : copy.remember}
                  </Text>
                </View>
                {assessment?.dynamic ? (
                  <Text style={styles.detail}>
                    {copy.reviewQuality}: {Math.round(assessment.score * 100)}%
                  </Text>
                ) : null}
                <View style={styles.expectedAnswerCard}>
                  {selfAssess || current.answer.mode === "text" ? (
                    <>
                      <Text style={styles.expectedAnswerLabel}>
                        {copy.answerLabel}
                      </Text>
                      <Text style={styles.expectedAnswerText}>
                        {submittedAnswer}
                      </Text>
                    </>
                  ) : null}
                  <Text style={styles.expectedAnswerLabel}>
                    {selfAssess ? copy.reviewModelAnswer : copy.expectedAnswer}
                  </Text>
                  <Text style={styles.expectedAnswerText}>
                    {assessment?.suggestedAnswer ?? expectedAnswer}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewTeachingCard}>
                {currentAudioPrompt ? (
                  <View style={styles.reviewTeachingSection}>
                    <Text style={styles.dictionarySectionLabel}>
                      {copy.listeningTranscript}
                    </Text>
                    <Text style={styles.reviewTeachingText}>
                      {currentAudioPrompt.text}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.reviewTeachingSection}>
                  <Text style={styles.dictionarySectionLabel}>
                    {copy.reviewExplanation}
                  </Text>
                  <Text style={styles.reviewTeachingText}>
                    {assessment?.explanation ?? current.explanation}
                  </Text>
                </View>
                <View style={styles.reviewTeachingSection}>
                  <Text style={styles.dictionarySectionLabel}>
                    {copy.reviewUsageTip}
                  </Text>
                  <Text style={styles.reviewTeachingText}>
                    {assessment?.usageTip ?? current.usageTip}
                  </Text>
                </View>
                {current.context ? (
                  <Text style={styles.detail}>{current.context}</Text>
                ) : null}
              </View>

              {assessmentError ||
              assessment?.assessment?.source === "unavailable" ? (
                <Text style={styles.detail}>{copy.aiFallbackNotice}</Text>
              ) : null}
              {unresolved ? (
                <>
                  <Text style={styles.detail}>
                    {copy.assessmentUnresolvedNotice}
                  </Text>
                  <PrimaryButton
                    label={copy.skipUnresolved}
                    onPress={onSkip ?? onClose}
                    disabled={disabled}
                  />
                </>
              ) : correct || partial || manualAssessment ? (
                <>
                  <Text style={styles.reviewRatePrompt}>
                    {manualAssessment
                      ? copy.reviewSelfAssessPrompt
                      : copy.reviewRatePrompt}
                  </Text>
                  <View style={styles.ratingRow}>
                    {(partial
                      ? (["again", "hard"] as ReviewRating[])
                      : reviewRatingsForAnswer(correct, manualAssessment)
                    ).map((rating) => {
                      const nextReview = formatReviewInterval(
                        current.ratingIntervalsMinutes[rating],
                        locale,
                      );
                      return (
                        <Pressable
                          key={rating}
                          accessibilityRole="button"
                          accessibilityLabel={`${copy[rating]}. ${copy.reviewNext}: ${nextReview}`}
                          accessibilityState={{ disabled }}
                          disabled={disabled}
                          onPress={() => onRate(rating)}
                          style={({ pressed }) => [
                            styles.ratingOption,
                            disabled && styles.disabled,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.ratingOptionTitle}>
                            {copy[rating]}
                          </Text>
                          <Text style={styles.ratingOptionHint}>
                            {copy.reviewNext}: {nextReview}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.reviewRatePrompt}>
                    {copy.reviewIncorrectPrompt}
                  </Text>
                  <Text style={styles.reviewNextText}>
                    {copy.reviewNext}:{" "}
                    {formatReviewInterval(
                      current.ratingIntervalsMinutes.again,
                      locale,
                    )}
                  </Text>
                  <PrimaryButton
                    label={copy.next}
                    onPress={() => onRate("again")}
                    disabled={disabled}
                  />
                </>
              )}
            </>
          )}
        </>
      ) : (
        <View style={styles.summary}>
          <Text style={styles.summaryScore}>✓</Text>
          <Text style={styles.optionTitle}>
            {batchTotal ? copy.reviewBatchComplete : copy.noReviews}
          </Text>
          {remainingDue > 0 ? (
            <Text style={styles.detail}>
              {copy.reviewMoreDue.replace("{count}", String(remainingDue))}
            </Text>
          ) : null}
          {onNextBatch ? (
            <>
              <Text style={styles.detail}>{copy.reviewBatchSize}</Text>
              <View style={styles.ratingRow}>
                {([5, 10] as const).map((size) => (
                  <SmallButton
                    key={size}
                    label={`${size}`}
                    onPress={() => onNextBatch(size)}
                  />
                ))}
              </View>
              {remainingDue > 0 ? (
                <PrimaryButton
                  label={copy.reviewNextBatch}
                  onPress={() => onNextBatch(batchSize)}
                />
              ) : null}
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}
