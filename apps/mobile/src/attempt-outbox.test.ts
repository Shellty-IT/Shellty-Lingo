import { describe, expect, it, vi } from "vitest";
import {
  AttemptOutbox,
  type OwnedAttempt,
  type AttemptResult,
} from "./attempt-outbox";
import { AttemptFileStore } from "./attempt-file-store";

const attempt = (
  key = "answer:1",
  ownerId = "user-1",
): Extract<OwnedAttempt, { kind: "lesson" }> => ({
  kind: "lesson",
  ownerId,
  sessionId: "session-1",
  exerciseId: key,
  answer: "original",
  idempotencyKey: key,
});
const result: AttemptResult = {
  attemptId: "attempt-1",
  exerciseId: "answer:1",
  correct: true,
  score: 1,
  feedback: {},
  alreadyRecorded: false,
};
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};
const fixture = () => {
  let stored: OwnedAttempt[] = [];
  const read = vi.fn(() => Promise.resolve(structuredClone(stored)));
  const write = vi.fn((items: OwnedAttempt[]) => {
    stored = structuredClone(items);
    return Promise.resolve();
  });
  const send = vi.fn((): Promise<AttemptResult> => Promise.resolve(result));
  const create = () =>
    new AttemptOutbox({
      read,
      write,
      send,
      retryable: (error) => error instanceof TypeError,
      capacity: 3,
    });
  return { create, read, write, send };
};

describe("durable attempt outbox", () => {
  it("restores the frozen payload after a restart and a lost HTTP response", async () => {
    const f = fixture();
    const first = f.create();
    await first.enqueue(attempt());
    f.send.mockRejectedValueOnce(new TypeError("response lost"));
    await first.send(attempt(), "token");
    const restarted = f.create();
    expect(await restarted.list("user-1")).toEqual([attempt()]);
    const outcomes = await restarted.flush("user-1", "token");
    expect(outcomes[0]).toMatchObject({ result });
    expect(f.send.mock.calls).toHaveLength(2);
    expect(await restarted.list("user-1")).toEqual([]);
  });

  it("does not acknowledge a disk failure as a persisted attempt", async () => {
    const f = fixture();
    f.write.mockRejectedValueOnce(new Error("disk full"));
    const outbox = f.create();
    await expect(outbox.enqueue(attempt())).rejects.toThrow("disk full");
    expect(await outbox.list("user-1")).toEqual([]);
  });

  it("rejects changed answers under the same request key", async () => {
    const outbox = fixture().create();
    await outbox.enqueue(attempt());
    await expect(
      outbox.enqueue({ ...attempt(), answer: "changed" }),
    ).rejects.toThrow("ATTEMPT_PAYLOAD_CHANGED");
    expect((await outbox.list("user-1"))[0]).toEqual(attempt());
  });

  it("preserves a newly enqueued answer while another answer is being flushed", async () => {
    const f = fixture();
    const response = deferred<AttemptResult>();
    f.send.mockReturnValueOnce(response.promise);
    const outbox = f.create();
    await outbox.enqueue(attempt());
    const flush = outbox.flush("user-1", "token");
    await vi.waitFor(() => expect(f.send).toHaveBeenCalledOnce());
    await outbox.enqueue(attempt("answer:2"));
    response.resolve(result);
    await flush;
    expect(await outbox.list("user-1")).toEqual([attempt("answer:2")]);
  });

  it("serializes simultaneous enqueues without dropping either answer", async () => {
    const outbox = fixture().create();
    await Promise.all([
      outbox.enqueue(attempt()),
      outbox.enqueue(attempt("answer:2")),
    ]);
    expect(await outbox.list("user-1")).toHaveLength(2);
  });

  it("only flushes the signed-in account's attempts", async () => {
    const f = fixture();
    const outbox = f.create();
    await outbox.enqueue(attempt());
    await outbox.enqueue(attempt("answer:2", "user-2"));
    await outbox.flush("user-1", "token");
    expect(f.send).toHaveBeenCalledOnce();
    expect(await outbox.list("user-2")).toEqual([
      attempt("answer:2", "user-2"),
    ]);
  });

  it("coalesces a foreground retry and a background flush", async () => {
    const f = fixture();
    const response = deferred<AttemptResult>();
    f.send.mockReturnValueOnce(response.promise);
    const outbox = f.create();
    await outbox.enqueue(attempt());
    const foreground = outbox.send(attempt(), "token");
    const background = outbox.flush("user-1", "token");
    response.resolve(result);
    await Promise.all([foreground, background]);
    expect(f.send).toHaveBeenCalledOnce();
  });

  it("does not evict old progress when the queue is full", async () => {
    const outbox = fixture().create();
    for (const key of ["one", "two", "three"])
      await outbox.enqueue(attempt(key));
    await expect(outbox.enqueue(attempt("four"))).rejects.toThrow(
      "ATTEMPT_QUEUE_FULL",
    );
    expect(await outbox.list("user-1")).toHaveLength(3);
  });

  it("keeps an acknowledged answer safe to replay if queue deletion fails", async () => {
    const f = fixture();
    const outbox = f.create();
    await outbox.enqueue(attempt());
    f.write.mockRejectedValueOnce(new Error("disk error"));
    expect(await outbox.send(attempt(), "token")).toMatchObject({ result });
    expect(await outbox.list("user-1")).toEqual([attempt()]);
    expect(outbox.outcomes("user-1")[0]).toMatchObject({ result });
  });
});

describe("recoverable queue snapshots", () => {
  const files = () => {
    const contents = new Map<number, string>();
    const read = vi.fn((slot: number) =>
      Promise.resolve(contents.get(slot) ?? null),
    );
    const write = vi.fn((slot: number, value: string) => {
      contents.set(slot, value);
      return Promise.resolve();
    });
    return {
      contents,
      read,
      write,
      store: new AttemptFileStore({ read, write }),
    };
  };

  it("recovers the last committed queue after an interrupted replacement", async () => {
    const f = files();
    await f.store.write([attempt()]);
    f.write.mockImplementationOnce((slot) => {
      f.contents.set(slot, '{"revision":2,');
      return Promise.reject(new Error("power lost"));
    });
    await expect(f.store.write([attempt(), attempt("two")])).rejects.toThrow();
    expect(await new AttemptFileStore(f).read()).toEqual([attempt()]);
  });

  it("uses the newest complete snapshot, including an empty queue", async () => {
    const f = files();
    await f.store.write([attempt()]);
    await f.store.write([]);
    expect(await new AttemptFileStore(f).read()).toEqual([]);
  });

  it("reports corruption instead of silently discarding progress", async () => {
    const f = files();
    f.contents.set(0, "broken");
    await expect(f.store.read()).rejects.toThrow("ATTEMPT_QUEUE_UNREADABLE");
  });

  it("rejects a write that did not actually persist", async () => {
    const f = files();
    f.write.mockResolvedValueOnce();
    await expect(f.store.write([attempt()])).rejects.toThrow(
      "ATTEMPT_QUEUE_WRITE_FAILED",
    );
  });
});
