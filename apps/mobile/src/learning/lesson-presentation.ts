import type {
  ExerciseAttemptResult,
  LearnerExercise,
} from "@shellty/api-contracts";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export function answerIsReady(
  exercise: LearnerExercise,
  selected: string[],
  typedAnswer: string,
  matchingPairs: Record<string, string>,
): boolean {
  if (exercise.type === "matching")
    return Boolean(
      exercise.matching &&
      Object.keys(matchingPairs).length === exercise.matching.left.length,
    );
  if (exercise.type === "gap_fill" || exercise.type === "typed_answer")
    return typedAnswer.trim().length > 0;
  return selected.length > 0;
}

export function feedbackTone(
  feedback: ExerciseAttemptResult,
): "correct" | "partial" | "incorrect" {
  if (feedback.correct) return "correct";
  if (feedback.score > 0) return "partial";
  return "incorrect";
}

export function expectedAnswerText(
  exercise: LearnerExercise,
  expected: unknown,
): string | null {
  const optionText = (value: string): string =>
    exercise.options?.find((option) => option.id === value)?.text ?? value;

  if (typeof expected === "string") return optionText(expected);
  if (Array.isArray(expected)) {
    const values = expected.filter(
      (value): value is string => typeof value === "string",
    );
    if (values.length === 0) return null;
    const separator = exercise.type === "ordering" ? " " : " / ";
    return values.map(optionText).join(separator);
  }

  const pairs = asRecord(expected);
  if (!pairs || !exercise.matching) return null;
  const lines = Object.entries(pairs).flatMap(([leftId, rightValue]) => {
    if (typeof rightValue !== "string") return [];
    const left = exercise.matching?.left.find((item) => item.id === leftId);
    const right = exercise.matching?.right.find(
      (item) => item.id === rightValue,
    );
    return left && right ? [`${left.text} → ${right.text}`] : [];
  });
  return lines.length > 0 ? lines.join("\n") : null;
}
