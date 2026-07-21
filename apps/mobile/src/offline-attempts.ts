import { File, Paths } from "expo-file-system";

import { apiRequest, isRetryableRequestError } from "./api";

// The queue lives in the document directory, not SecureStore: attempt payloads
// are not secrets, and SecureStore values are limited to ~2 KB on Android, which
// would silently drop queued progress.
const fileName = "shellty-pending-attempts.v1.json";
const maximumQueueLength = 100;

type PendingAttempt = {
  sessionId: string;
  exerciseId: string;
  answer: unknown;
  idempotencyKey: string;
};

const queueFile = (): File => new File(Paths.document, fileName);

async function read(): Promise<PendingAttempt[]> {
  try {
    const file = queueFile();
    if (!file.exists) return [];
    const parsed: unknown = JSON.parse(await file.text());
    return Array.isArray(parsed) ? (parsed as PendingAttempt[]) : [];
  } catch {
    // A corrupt or unreadable queue must not block learning; start fresh.
    return [];
  }
}

function write(pending: PendingAttempt[]): void {
  const file = queueFile();
  if (!file.exists) file.create({ intermediates: true, overwrite: true });
  file.write(JSON.stringify(pending));
}

export async function queueAttempt(attempt: PendingAttempt): Promise<void> {
  const pending = await read();
  if (pending.some((item) => item.idempotencyKey === attempt.idempotencyKey))
    return;
  // Bounded queue: keep the newest attempts — the oldest are the most likely to
  // belong to sessions that no longer accept answers.
  const next = [...pending, attempt].slice(-maximumQueueLength);
  try {
    write(next);
  } catch {
    // Failing to persist must not crash the exercise flow; the answer is lost
    // only for retry purposes and the user still sees the offline notice.
  }
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
  try {
    write(remaining);
  } catch {
    // Keeping the previous file is safe: every attempt is idempotent, so a
    // re-flush after a failed write cannot double-count answers.
  }
  return { completed, rejected };
}
