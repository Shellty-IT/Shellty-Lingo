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
  return answer.mode === "text" || answer.mode === "self_assess"
    ? typedAnswer.trim().length > 0
    : selectedOptionIds.length > 0;
}

export function reviewAnswerCorrect(
  answer: ReviewAnswer,
  typedAnswer: string,
  selectedOptionIds: string[],
): boolean {
  if (answer.mode === "text" || answer.mode === "self_assess") {
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
  if (answer.mode === "text" || answer.mode === "self_assess")
    return answer.expectedAnswer;
  const correctIds = new Set(answer.correctOptionIds);
  return answer.options
    .filter((option) => correctIds.has(option.id))
    .map((option) => option.text)
    .join(", ");
}

export function reviewRatingsForAnswer(
  correct: boolean,
  selfAssess = false,
): ReviewRating[] {
  return selfAssess
    ? ["again", "hard", "good", "easy"]
    : correct
      ? ["hard", "good", "easy"]
      : ["again"];
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

  // Hermes does not implement Intl.RelativeTimeFormat on native React Native.
  // Keep this formatter dependency-free so revealing an answer cannot throw on
  // Android or iOS while still giving every supported locale natural copy.
  if (locale === "th") {
    const thaiUnits = { day: "วัน", hour: "ชั่วโมง", minute: "นาที" };
    return `ในอีก ${value} ${thaiUnits[unit]}`;
  }
  if (locale === "en") {
    return `in ${value} ${unit}${value === 1 ? "" : "s"}`;
  }

  const polishUnits = {
    day: ["dzień", "dni", "dni"],
    hour: ["godzinę", "godziny", "godzin"],
    minute: ["minutę", "minuty", "minut"],
  } as const;
  const forms = polishUnits[unit];
  const lastTwoDigits = value % 100;
  const lastDigit = value % 10;
  const form =
    value === 1
      ? forms[0]
      : lastDigit >= 2 &&
          lastDigit <= 4 &&
          (lastTwoDigits < 12 || lastTwoDigits > 14)
        ? forms[1]
        : forms[2];
  return `za ${value} ${form}`;
}
