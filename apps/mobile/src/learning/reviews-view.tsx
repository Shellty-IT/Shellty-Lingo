import { Pressable, Text, View } from "react-native";
import type { ReviewQueueItem, ReviewRating } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";

import { SmallButton } from "./shared";
import { styles } from "./styles";

const ratings: ReviewRating[] = ["again", "hard", "good", "easy"];

export function ReviewsView({
  reviews,
  copy,
  onClose,
  onRate,
}: {
  reviews: ReviewQueueItem[];
  copy: TranslationMap;
  onClose: () => void;
  onRate: (rating: ReviewRating) => void;
}) {
  const current = reviews[0];
  return (
    <View style={styles.flow}>
      <View style={styles.courseHeader}>
        <Text style={styles.title}>{copy.reviews}</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      {current ? (
        <>
          <View style={styles.promptCard}>
            <Text style={styles.prompt}>{current.sourceText}</Text>
          </View>
          <View style={styles.dictionaryCard}>
            <Text style={styles.dictionaryMeaning}>
              {current.translation ?? copy.remember}
            </Text>
            {current.context ? (
              <Text style={styles.detail}>{current.context}</Text>
            ) : null}
          </View>
          <View style={styles.ratingRow}>
            {ratings.map((rating) => (
              <SmallButton
                key={rating}
                label={copy[rating]}
                onPress={() => onRate(rating)}
              />
            ))}
          </View>
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
