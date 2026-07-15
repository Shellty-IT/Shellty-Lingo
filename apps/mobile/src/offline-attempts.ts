import * as SecureStore from "expo-secure-store";

import { apiRequest, isRetryableRequestError } from "./api";

const storageKey = "shellty.pending-attempts.v1";

type PendingAttempt = {
  sessionId: string;
  exerciseId: string;
  answer: unknown;
  idempotencyKey: string;
};

async function read(): Promise<PendingAttempt[]> {
  const raw = await SecureStore.getItemAsync(storageKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingAttempt[];
  } catch {
    return [];
  }
}

export async function queueAttempt(attempt: PendingAttempt): Promise<void> {
  const pending = await read();
  const next = pending.some(
    (item) => item.idempotencyKey === attempt.idempotencyKey,
  )
    ? pending
    : [...pending, attempt];
  await SecureStore.setItemAsync(storageKey, JSON.stringify(next));
}

export async function flushAttempts(
  token: string,
): Promise<{ completed: number; rejected: number }> {
  const pending = await read();
  const remaining: PendingAttempt[] = [];
  let completed = 0;
  let rejected = 0;
  for (const attempt of pending) {
    try {
      await apiRequest(`/learning/sessions/${attempt.sessionId}/attempts`, {
        method: "POST",
        token,
        body: {
          exerciseId: attempt.exerciseId,
          answer: attempt.answer,
          idempotencyKey: attempt.idempotencyKey,
        },
      });
      completed += 1;
    } catch (error) {
      if (isRetryableRequestError(error)) remaining.push(attempt);
      else rejected += 1;
    }
  }
  await SecureStore.setItemAsync(storageKey, JSON.stringify(remaining));
  return { completed, rejected };
}
