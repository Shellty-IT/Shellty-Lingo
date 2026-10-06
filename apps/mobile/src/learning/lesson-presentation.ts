import type {
  ExerciseAttemptResult,
  ExerciseTutorHintResult,
  InterfaceLocale,
  LearnerExercise,
} from "@shellty/api-contracts";
import { orderingTileText } from "@shellty/api-contracts";

export const tutorHintForExercise = (
  hints: ExerciseTutorHintResult[],
  exerciseId: string,
): ExerciseTutorHintResult | undefined =>
  hints.find((hint) => hint.exerciseId === exerciseId);

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
  if (exercise.type === "ordering")
    return Boolean(
      exercise.options && selected.length === exercise.options.length,
    );
  if (
    exercise.type === "multiple_choice" &&
    exercise.responseConstraints?.selectionCount
  )
    return selected.length === exercise.responseConstraints.selectionCount;
  return selected.length > 0;
}

export function exerciseInstructionText(
  exercise: LearnerExercise,
  interfaceLocale: InterfaceLocale,
  localizedFallback: string,
): string {
  if (interfaceLocale !== (exercise.instructionsLocale ?? "en"))
    return localizedFallback;
  return exercise.instructions?.trim() || localizedFallback;
}

export function orderingOptionText(text: string): string {
  return orderingTileText(text);
}

export type AnswerMark = "correct" | "incorrect" | "expected" | undefined;
export function optionMark(
  exercise: LearnerExercise,
  selected: string[],
  optionId: string,
  expected: unknown,
): AnswerMark {
  if (exercise.type === "ordering") {
    const index = selected.indexOf(optionId);
    if (index < 0 || !Array.isArray(expected)) return undefined;
    return expected[index] === optionId ? "correct" : "incorrect";
  }
  const expectedIds =
    typeof expected === "string"
      ? [expected]
      : Array.isArray(expected)
        ? expected
        : [];
  if (selected.includes(optionId))
    return expectedIds.includes(optionId) ? "correct" : "incorrect";
  return expectedIds.includes(optionId) ? "expected" : undefined;
}
export function pairMark(
  leftId: string,
  rightId: string | undefined,
  expected: unknown,
): AnswerMark {
  const pairs = asRecord(expected);
  return rightId && pairs
    ? pairs[leftId] === rightId
      ? "correct"
      : "incorrect"
    : undefined;
}

export function feedbackTone(
  feedback: ExerciseAttemptResult,
): "correct" | "partial" | "incorrect" {
  if (feedback.correct) return "correct";
  if (feedback.feedback.assessment?.status === "needs_review") return "partial";
  if (feedback.score > 0) return "partial";
  return "incorrect";
}

export function expectedAnswerText(
  exercise: LearnerExercise,
  expected: unknown,
  expectedText?: string,
): string | null {
  if (exercise.type === "ordering" && expectedText?.trim())
    return expectedText.trim();
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
