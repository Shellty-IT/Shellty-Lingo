import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type {
  ReviewAssessment,
  ReviewQueueItem,
  ReviewRating,
} from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { speak } from "../speech";
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
}: {
  reviews: ReviewQueueItem[];
  copy: TranslationMap;
  locale: Locale;
  onClose: () => void;
  onRate: (rating: ReviewRating) => void;
  onAssess: (itemId: string, answer: string) => Promise<ReviewAssessment>;
  onAnswerFocus: () => void;
  disabled: boolean;
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
  const selfAssess = current?.answer.mode === "self_assess";

  useEffect(() => {
    setSelected([]);
    setTypedAnswer("");
    setRevealed(false);
    setAudioError(false);
    setAssessment(null);
    setAssessmentError(false);
  }, [current?.id]);

  const answerReady = current
    ? reviewAnswerReady(current.answer, typedAnswer, selected)
    : false;
  const exactCorrect = useMemo(
    () =>
      current
        ? reviewAnswerCorrect(current.answer, typedAnswer, selected)
        : false,
    [current, selected, typedAnswer],
  );
  const expectedAnswer = current ? expectedReviewAnswer(current.answer) : "";
  const verdict =
    assessment?.verdict ?? (exactCorrect ? "correct" : "incorrect");
  const correct = verdict === "correct";
  const partial = verdict === "almost";
  const manualAssessment = selfAssess && (!assessment || !assessment.dynamic);
  const submitAnswer = async () => {
    if (!current || !answerReady || disabled || assessing) return;
    if (
      current.answer.mode === "text" ||
      current.answer.mode === "self_assess"
    ) {
      setAssessing(true);
      setAssessmentError(false);
      try {
        setAssessment(await onAssess(current.id, typedAnswer.trim()));
      } catch {
        setAssessmentError(true);
      } finally {
        setAssessing(false);
      }
    }
    setRevealed(true);
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

          {!revealed ? (
            <>
              <Text style={styles.reviewInstruction}>
                {copy.reviewAnswerInstruction}
              </Text>
              {current.answer.mode === "text" ||
              current.answer.mode === "self_assess" ? (
                <TextInput
                  accessibilityLabel={copy.answerLabel}
                  style={styles.input}
                  value={typedAnswer}
                  onChangeText={setTypedAnswer}
                  placeholder={copy.answerPlaceholder}
                  placeholderTextColor={colors.textPlaceholder}
                  editable={!disabled}
                  returnKeyType="done"
                  onFocus={onAnswerFocus}
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
                  partial
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
                      partial
                        ? styles.feedbackIconPartial
                        : correct
                          ? styles.feedbackIconCorrect
                          : styles.feedbackIconIncorrect,
                    ]}
                  >
                    <Text style={styles.feedbackIconText}>
                      {partial ? "~" : correct ? "✓" : "!"}
                    </Text>
                  </View>
                  <Text style={styles.feedbackTitle}>
                    {partial
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
                        {typedAnswer.trim()}
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

              {assessmentError || (assessment && !assessment.dynamic) ? (
                <Text style={styles.detail}>{copy.aiFallbackNotice}</Text>
              ) : null}
              {correct || partial || manualAssessment ? (
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
          <Text style={styles.optionTitle}>{copy.noReviews}</Text>
        </View>
      )}
    </View>
  );
}
