import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { ReviewQueueItem, ReviewRating } from "@shellty/api-contracts";
import type { Locale, TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import { PrimaryButton } from "./shared";
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
  onAnswerFocus,
  disabled,
}: {
  reviews: ReviewQueueItem[];
  copy: TranslationMap;
  locale: Locale;
  onClose: () => void;
  onRate: (rating: ReviewRating) => void;
  onAnswerFocus: () => void;
  disabled: boolean;
}) {
  const current = reviews[0];
  const [selected, setSelected] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setSelected([]);
    setTypedAnswer("");
    setRevealed(false);
  }, [current?.id]);

  const answerReady = current
    ? reviewAnswerReady(current.answer, typedAnswer, selected)
    : false;
  const correct = useMemo(
    () =>
      current
        ? reviewAnswerCorrect(current.answer, typedAnswer, selected)
        : false,
    [current, selected, typedAnswer],
  );
  const expectedAnswer = current ? expectedReviewAnswer(current.answer) : "";

  const toggleOption = (id: string) => {
    if (!current || current.answer.mode === "text" || revealed) return;
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
          </View>

          {!revealed ? (
            <>
              <Text style={styles.reviewInstruction}>
                {copy.reviewAnswerInstruction}
              </Text>
              {current.answer.mode === "text" ? (
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
                    if (answerReady && !disabled) setRevealed(true);
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
                onPress={() => setRevealed(true)}
                disabled={!answerReady || disabled}
              />
            </>
          ) : (
            <>
              <View
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
                style={[
                  styles.feedbackPanel,
                  correct ? styles.feedbackCorrect : styles.feedbackIncorrect,
                ]}
              >
                <View style={styles.feedbackHeading}>
                  <View
                    style={[
                      styles.feedbackIcon,
                      correct
                        ? styles.feedbackIconCorrect
                        : styles.feedbackIconIncorrect,
                    ]}
                  >
                    <Text style={styles.feedbackIconText}>
                      {correct ? "✓" : "!"}
                    </Text>
                  </View>
                  <Text style={styles.feedbackTitle}>
                    {correct ? copy.correctAnswer : copy.remember}
                  </Text>
                </View>
                <View style={styles.expectedAnswerCard}>
                  <Text style={styles.expectedAnswerLabel}>
                    {copy.expectedAnswer}
                  </Text>
                  <Text style={styles.expectedAnswerText}>
                    {expectedAnswer}
                  </Text>
                </View>
              </View>

              <View style={styles.reviewTeachingCard}>
                <View style={styles.reviewTeachingSection}>
                  <Text style={styles.dictionarySectionLabel}>
                    {copy.reviewExplanation}
                  </Text>
                  <Text style={styles.reviewTeachingText}>
                    {current.explanation}
                  </Text>
                </View>
                <View style={styles.reviewTeachingSection}>
                  <Text style={styles.dictionarySectionLabel}>
                    {copy.reviewUsageTip}
                  </Text>
                  <Text style={styles.reviewTeachingText}>
                    {current.usageTip}
                  </Text>
                </View>
                {current.context ? (
                  <Text style={styles.detail}>{current.context}</Text>
                ) : null}
              </View>

              {correct ? (
                <>
                  <Text style={styles.reviewRatePrompt}>
                    {copy.reviewRatePrompt}
                  </Text>
                  <View style={styles.ratingRow}>
                    {reviewRatingsForAnswer(true).map((rating) => {
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
