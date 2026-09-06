import type { ReviewQueueItem, ReviewRating } from "@shellty/api-contracts";
import type { Locale } from "@shellty/i18n";

type ReviewAnswer = ReviewQueueItem["answer"];

const normalized = (value: string): string =>
  value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/[.,!?;:]+$/u, "")
    .replace(/\s+/g, " ");

export function reviewAnswerReady(
  answer: ReviewAnswer,
  typedAnswer: string,
  selectedOptionIds: string[],
): boolean {
  return answer.mode === "text"
    ? typedAnswer.trim().length > 0
    : selectedOptionIds.length > 0;
}

export function reviewAnswerCorrect(
  answer: ReviewAnswer,
  typedAnswer: string,
  selectedOptionIds: string[],
): boolean {
  if (answer.mode === "text") {
    const submitted = normalized(typedAnswer);
    return answer.acceptedAnswers.some(
      (accepted) => normalized(accepted) === submitted,
    );
  }
  const expected = [...answer.correctOptionIds].sort();
  const selected = [...selectedOptionIds].sort();
  return (
    selected.length === expected.length &&
    selected.every((id, index) => id === expected[index])
  );
}

export function expectedReviewAnswer(answer: ReviewAnswer): string {
  if (answer.mode === "text") return answer.expectedAnswer;
  const correctIds = new Set(answer.correctOptionIds);
  return answer.options
    .filter((option) => correctIds.has(option.id))
    .map((option) => option.text)
    .join(", ");
}

export function reviewRatingsForAnswer(correct: boolean): ReviewRating[] {
  return correct ? ["hard", "good", "easy"] : ["again"];
}

export function formatReviewInterval(
  intervalMinutes: number,
  locale: Locale,
): string {
  const [value, unit] =
    intervalMinutes % 1440 === 0
      ? [intervalMinutes / 1440, "day" as const]
      : intervalMinutes % 60 === 0
        ? [intervalMinutes / 60, "hour" as const]
        : [intervalMinutes, "minute" as const];
  return new Intl.RelativeTimeFormat(locale, { numeric: "always" }).format(
    value,
    unit,
  );
}
