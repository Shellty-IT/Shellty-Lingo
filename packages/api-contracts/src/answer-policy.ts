export const ANSWER_POLICY_VERSION = "answer-v2";
export type AnswerNormalizationPolicy = "sentence-v2" | "gap-v2";

/** Preserve apostrophes, internal punctuation and Thai tone marks. */
export function normalizeAnswer(
  value: string,
  policy: AnswerNormalizationPolicy = "sentence-v2",
): string {
  const normalized = value
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[’‘]/gu, "'")
    .replace(/\s+/gu, " ");
  return policy === "sentence-v2"
    ? normalized.replace(/[.!?]+$/u, "")
    : normalized;
}
