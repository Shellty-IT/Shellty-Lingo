import type { OwnedAttempt } from "./attempt-outbox";

type Snapshot = { revision: number; attempts: OwnedAttempt[] };
const validAttempt = (value: unknown): value is OwnedAttempt => {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OwnedAttempt>;
  if (
    typeof item.ownerId !== "string" ||
    typeof item.idempotencyKey !== "string"
  )
    return false;
  if (item.kind === "lesson")
    return (
      typeof item.sessionId === "string" &&
      typeof item.exerciseId === "string" &&
      "answer" in item
    );
  return (
    item.kind === "review" &&
    typeof item.itemId === "string" &&
    ["again", "hard", "good", "easy"].includes(item.rating ?? "") &&
    (item.expectedScheduleRevision === undefined ||
      (Number.isSafeInteger(item.expectedScheduleRevision) &&
        item.expectedScheduleRevision >= 0))
  );
};

/** Alternating snapshots preserve a committed queue even if a write is interrupted. */
export class AttemptFileStore {
  constructor(
    private readonly files: {
      read: (slot: number) => Promise<string | null>;
      write: (slot: number, value: string) => Promise<void>;
    },
  ) {}

  private async snapshot(): Promise<Snapshot> {
    const raw = await Promise.all([this.files.read(0), this.files.read(1)]);
    const snapshots = raw.flatMap((value) => {
      if (value === null) return [];
      try {
        const parsed = JSON.parse(value) as Partial<Snapshot> | null;
        return parsed &&
          Number.isSafeInteger(parsed.revision) &&
          parsed.revision! >= 0 &&
          Array.isArray(parsed.attempts) &&
          parsed.attempts.every(validAttempt)
          ? [parsed as Snapshot]
          : [];
      } catch {
        return [];
      }
    });
    if (!snapshots.length && raw.some((value) => value !== null))
      throw new Error("ATTEMPT_QUEUE_UNREADABLE");
    return (
      snapshots.sort((left, right) => right.revision - left.revision)[0] ?? {
        revision: 0,
        attempts: [],
      }
    );
  }

  async read(): Promise<OwnedAttempt[]> {
    return (await this.snapshot()).attempts;
  }

  async write(attempts: OwnedAttempt[]): Promise<void> {
    const revision = (await this.snapshot()).revision + 1;
    const serialized = JSON.stringify({ revision, attempts });
    const slot = revision % 2;
    await this.files.write(slot, serialized);
    if ((await this.files.read(slot)) !== serialized)
      throw new Error("ATTEMPT_QUEUE_WRITE_FAILED");
  }
}
