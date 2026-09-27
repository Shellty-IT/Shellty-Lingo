import { File, Paths } from "expo-file-system";

import { apiRequest, isRetryableRequestError } from "./api";
import { readSession } from "./session";
import { AttemptOutbox, type AttemptResult } from "./attempt-outbox";
import { AttemptFileStore } from "./attempt-file-store";

const fileName = "shellty-pending-attempts.v2";
const store = new AttemptFileStore({
  read: async (slot) => {
    const file = new File(Paths.document, `${fileName}.${slot}.json`);
    return file.exists ? file.text() : null;
  },
  write: (slot, value) => {
    const file = new File(Paths.document, `${fileName}.${slot}.json`);
    if (!file.exists) file.create({ intermediates: true });
    file.write(value);
    return Promise.resolve();
  },
});

export const attemptOutbox = new AttemptOutbox({
  read: () => store.read(),
  write: (attempts) => store.write(attempts),
  send: async (attempt, token): Promise<AttemptResult> => {
    if (attempt.kind === "lesson")
      return apiRequest(`/learning/sessions/${attempt.sessionId}/attempts`, {
        method: "POST",
        token,
        expectedUserId: attempt.ownerId,
        body: {
          exerciseId: attempt.exerciseId,
          answer: attempt.answer,
          idempotencyKey: attempt.idempotencyKey,
        },
      });
    return apiRequest(`/learning/reviews/${attempt.itemId}`, {
      method: "POST",
      token,
      expectedUserId: attempt.ownerId,
      body: {
        rating: attempt.rating,
        idempotencyKey: attempt.idempotencyKey,
        expectedScheduleRevision: attempt.expectedScheduleRevision,
      },
    });
  },
  retryable: isRetryableRequestError,
});

export async function attemptOwner(): Promise<string> {
  const session = await readSession();
  if (!session) throw new Error("ATTEMPT_SESSION_UNAVAILABLE");
  return session.user.id;
}

/** A server-authorized resumed session proves ownership of old unscoped entries. */
export async function recoverLegacyLesson(sessionId: string): Promise<void> {
  const file = new File(Paths.document, "shellty-pending-attempts.v1.json");
  if (!file.exists) return;
  const parsed: unknown = JSON.parse(await file.text());
  if (!Array.isArray(parsed)) throw new Error("ATTEMPT_QUEUE_UNREADABLE");
  const ownerId = await attemptOwner();
  for (const value of parsed) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    if (
      item.sessionId !== sessionId ||
      typeof item.exerciseId !== "string" ||
      typeof item.idempotencyKey !== "string" ||
      !("answer" in item)
    )
      continue;
    await attemptOutbox.enqueue({
      kind: "lesson",
      ownerId,
      sessionId,
      exerciseId: item.exerciseId,
      idempotencyKey: item.idempotencyKey,
      answer: item.answer,
    });
  }
  // Preserve the original file: other sessions may belong to another account.
}

export async function flushAttempts(
  token: string,
): Promise<{ completed: number; rejected: number }> {
  const outcomes = await attemptOutbox.flush(await attemptOwner(), token);
  return {
    completed: outcomes.filter((outcome) => "result" in outcome).length,
    rejected: outcomes.filter(
      (outcome) =>
        "error" in outcome && !isRetryableRequestError(outcome.error),
    ).length,
  };
}
