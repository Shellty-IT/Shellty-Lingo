import type {
  ExerciseAttemptResult,
  RateReviewRequest,
  ReviewResult,
} from "@shellty/api-contracts";

export type PendingAttempt =
  | {
      kind: "lesson";
      sessionId: string;
      exerciseId: string;
      answer: unknown;
      idempotencyKey: string;
    }
  | ({ kind: "review"; itemId: string } & RateReviewRequest);

export type OwnedAttempt = PendingAttempt & { ownerId: string };
export type AttemptResult = ExerciseAttemptResult | ReviewResult;
export type AttemptOutcome =
  | { attempt: OwnedAttempt; result: AttemptResult }
  | { attempt: OwnedAttempt; error: unknown };

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
};

export const sameAttempt = (left: OwnedAttempt, right: OwnedAttempt): boolean =>
  left.ownerId === right.ownerId &&
  left.idempotencyKey === right.idempotencyKey;

/** Serializes storage changes, while network requests never hold the storage lock. */
export class AttemptOutbox {
  private storageTail: Promise<unknown> = Promise.resolve();
  private readonly inFlight = new Map<string, Promise<AttemptOutcome>>();
  private readonly listeners = new Set<(outcome: AttemptOutcome) => void>();
  private readonly recent = new Map<string, AttemptOutcome>();

  constructor(
    private readonly dependencies: {
      read: () => Promise<OwnedAttempt[]>;
      write: (attempts: OwnedAttempt[]) => Promise<void>;
      send: (attempt: OwnedAttempt, token: string) => Promise<AttemptResult>;
      retryable: (error: unknown) => boolean;
      capacity?: number;
    },
  ) {}

  private locked<T>(action: () => Promise<T>): Promise<T> {
    const result = this.storageTail.then(action, action);
    this.storageTail = result.catch(() => undefined);
    return result;
  }

  list(ownerId: string): Promise<OwnedAttempt[]> {
    return this.locked(async () =>
      (await this.dependencies.read()).filter(
        (item) => item.ownerId === ownerId,
      ),
    );
  }

  enqueue(attempt: OwnedAttempt): Promise<void> {
    return this.locked(async () => {
      const items = await this.dependencies.read();
      const existing = items.find((item) => sameAttempt(item, attempt));
      if (existing) {
        if (canonical(existing) !== canonical(attempt))
          throw new Error("ATTEMPT_PAYLOAD_CHANGED");
        return;
      }
      if (items.length >= (this.dependencies.capacity ?? 100))
        throw new Error("ATTEMPT_QUEUE_FULL");
      await this.dependencies.write([...items, attempt]);
    });
  }

  private remove(attempt: OwnedAttempt): Promise<void> {
    return this.locked(async () => {
      const items = await this.dependencies.read();
      await this.dependencies.write(
        items.filter((item) => !sameAttempt(item, attempt)),
      );
    });
  }

  subscribe(listener: (outcome: AttemptOutcome) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  outcomes(ownerId: string): AttemptOutcome[] {
    return [...this.recent.values()].filter(
      (outcome) => outcome.attempt.ownerId === ownerId,
    );
  }

  send(attempt: OwnedAttempt, token: string): Promise<AttemptOutcome> {
    const key = `${attempt.ownerId}:${attempt.idempotencyKey}`;
    const active = this.inFlight.get(key);
    if (active) return active;
    const operation = (async (): Promise<AttemptOutcome> => {
      let outcome: AttemptOutcome;
      try {
        const result = await this.dependencies.send(attempt, token);
        outcome = { attempt, result };
      } catch (error) {
        outcome = { attempt, error };
      }
      if ("result" in outcome || !this.dependencies.retryable(outcome.error)) {
        try {
          await this.remove(attempt);
        } catch {
          /* Preserve the previous file. */
        }
      }
      this.recent.set(key, outcome);
      if (this.recent.size > 100)
        this.recent.delete(this.recent.keys().next().value!);
      for (const listener of this.listeners) listener(outcome);
      return outcome;
    })().finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, operation);
    return operation;
  }

  async flush(ownerId: string, token: string): Promise<AttemptOutcome[]> {
    const outcomes: AttemptOutcome[] = [];
    for (const attempt of await this.list(ownerId)) {
      const outcome = await this.send(attempt, token);
      outcomes.push(outcome);
      if ("error" in outcome && this.dependencies.retryable(outcome.error))
        break;
    }
    return outcomes;
  }
}
