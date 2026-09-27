/* Async act waits for React effects and their promise chains. */
/* eslint-disable @typescript-eslint/require-await */
import { createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AttemptOutcome, OwnedAttempt } from "../attempt-outbox";

const ports = vi.hoisted(() => ({
  list: vi.fn(),
  enqueue: vi.fn(),
  send: vi.fn(),
  outcomes: vi.fn(),
  owner: vi.fn(),
  subscribe: vi.fn(),
  active: vi.fn(),
  online: vi.fn(),
}));
vi.mock("react-native", () => ({
  AppState: { currentState: "active", addEventListener: ports.active },
}));
vi.mock("../offline-attempts", () => ({
  attemptOwner: ports.owner,
  attemptOutbox: {
    list: ports.list,
    enqueue: ports.enqueue,
    send: ports.send,
    outcomes: ports.outcomes,
    subscribe: ports.subscribe,
  },
}));
vi.mock("../api", () => ({
  isRetryableRequestError: (error: unknown) => error instanceof TypeError,
}));
import { useReliableAttempt } from "./use-reliable-attempt";

const pending: OwnedAttempt = {
  kind: "lesson",
  ownerId: "user-1",
  sessionId: "session",
  exerciseId: "first",
  answer: "original",
  idempotencyKey: "answer:first",
};
const graded: AttemptOutcome = {
  attempt: pending,
  result: {
    exerciseId: "first",
    attemptId: "attempt",
    correct: true,
    score: 1,
    feedback: {},
    alreadyRecorded: true,
  },
};
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

describe("reliable attempt lifecycle", () => {
  let renderer: ReactTestRenderer;
  let current: ReturnType<typeof useReliableAttempt>;
  const Harness = ({ scope = "first" }: { scope?: string }) => {
    current = useReliableAttempt(
      "token",
      scope,
      (attempt) => attempt.kind === "lesson" && attempt.exerciseId === scope,
    );
    return null;
  };
  const mount = async () => {
    await act(async () => {
      renderer = create(createElement(Harness));
    });
  };

  beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    vi.clearAllMocks();
    ports.owner.mockResolvedValue("user-1");
    ports.list.mockResolvedValue([]);
    ports.outcomes.mockReturnValue([]);
    ports.enqueue.mockResolvedValue(undefined);
    ports.send.mockResolvedValue(graded);
    ports.subscribe.mockReturnValue(vi.fn());
    ports.active.mockReturnValue({ remove: vi.fn() });
  });
  afterEach(async () => {
    if (renderer) await act(async () => renderer.unmount());
  });

  it("freezes the submitted payload and retries it after a lost response", async () => {
    await mount();
    ports.send.mockResolvedValueOnce({
      attempt: pending,
      error: new TypeError("offline"),
    });
    await act(async () => {
      await current.submit(pending);
    });
    expect(current.phase).toBe("pending_sync");
    expect(current.locked).toBe(true);
    await act(async () => {
      await current.submit({ ...pending, answer: "changed" });
    });
    expect(ports.send).toHaveBeenCalledOnce();
    await act(async () => current.retry());
    expect(ports.send.mock.calls[1]?.[0]).toEqual(pending);
    expect(current.phase).toBe("graded");
  });

  it("does not claim local persistence when storage fails", async () => {
    await mount();
    ports.enqueue.mockRejectedValue(new Error("disk full"));
    ports.send.mockResolvedValue({
      attempt: pending,
      error: new TypeError("offline"),
    });
    await act(async () => {
      await current.submit(pending);
    });
    expect(current.phase).toBe("retryable_error");
    expect(current.persisted).toBe(false);
  });

  it("restores a pending answer on restart without allowing it to be edited", async () => {
    ports.list.mockResolvedValue([pending]);
    const response = deferred<AttemptOutcome>();
    ports.send.mockReturnValue(response.promise);
    await mount();
    expect(current.attempt).toEqual(pending);
    expect(current.locked).toBe(true);
    await act(async () => response.resolve(graded));
    expect(current.result).toEqual(graded.result);
  });

  it("ignores a late answer after the active exercise changes", async () => {
    await mount();
    const response = deferred<AttemptOutcome>();
    ports.send.mockReturnValue(response.promise);
    let submission!: Promise<void>;
    await act(async () => {
      submission = current.submit(pending);
    });
    await act(async () =>
      renderer.update(createElement(Harness, { scope: "second" })),
    );
    await act(async () => {
      response.resolve(graded);
      await submission;
    });
    expect(current.phase).toBe("draft");
    expect(current.result).toBeUndefined();
  });

  it("uses a completed background receipt rather than reopening a stale draft", async () => {
    ports.outcomes.mockReturnValue([graded]);
    await mount();
    expect(current.phase).toBe("graded");
    expect(current.result).toEqual(graded.result);
  });

  it("retries when the app returns to the foreground", async () => {
    await mount();
    ports.send.mockResolvedValueOnce({
      attempt: pending,
      error: new TypeError("offline"),
    });
    await act(async () => {
      await current.submit(pending);
    });
    const resume = ports.active.mock.calls.at(-1)?.[1] as (
      state: string,
    ) => void;
    await act(async () => resume("active"));
    expect(current.phase).toBe("graded");
  });
});
