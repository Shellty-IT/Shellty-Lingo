import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import { isRetryableRequestError } from "../api";
import { attemptOutbox, attemptOwner } from "../offline-attempts";
import {
  sameAttempt,
  type AttemptOutcome,
  type AttemptResult,
  type OwnedAttempt,
  type PendingAttempt,
} from "../attempt-outbox";

export type AttemptPhase =
  | "restoring"
  | "draft"
  | "submitting"
  | "pending_sync"
  | "graded"
  | "retryable_error"
  | "rejected";
type AttemptState = {
  phase: AttemptPhase;
  attempt?: OwnedAttempt;
  result?: AttemptResult;
  persisted: boolean;
};

/** The scope identifies an exercise/occurrence, never the draft's current text. */
export function useReliableAttempt(
  token: string,
  scope: string,
  matches: (attempt: OwnedAttempt) => boolean,
) {
  const [state, setState] = useState<AttemptState>({
    phase: "restoring",
    persisted: false,
  });
  const stateRef = useRef(state);
  const generation = useRef(0);
  const matchesRef = useRef(matches);
  matchesRef.current = matches;
  const update = (next: AttemptState) => {
    stateRef.current = next;
    setState(next);
  };

  const run = async (attempt: OwnedAttempt, epoch: number) => {
    let persisted: boolean;
    try {
      await attemptOutbox.enqueue(attempt);
      persisted = true;
    } catch {
      persisted = false;
    }
    if (generation.current !== epoch) return;
    update({ phase: "submitting", attempt, persisted });
    const outcome = await attemptOutbox.send(attempt, token);
    if (generation.current === epoch) apply(outcome, persisted);
  };

  const apply = (
    outcome: AttemptOutcome,
    persisted = stateRef.current.persisted,
  ) => {
    const current = stateRef.current;
    if (!current.attempt || !sameAttempt(current.attempt, outcome.attempt))
      return;
    if ("result" in outcome)
      update({
        phase: "graded",
        attempt: outcome.attempt,
        result: outcome.result,
        persisted,
      });
    else
      update({
        phase: isRetryableRequestError(outcome.error)
          ? persisted
            ? "pending_sync"
            : "retryable_error"
          : "rejected",
        attempt: outcome.attempt,
        persisted,
      });
  };

  useEffect(() => {
    const epoch = ++generation.current;
    update({ phase: "restoring", persisted: false });
    const unsubscribe = attemptOutbox.subscribe((outcome) => {
      if (generation.current === epoch) apply(outcome);
    });
    void attemptOwner()
      .then(async (owner) => {
        const pending = (await attemptOutbox.list(owner)).find((attempt) =>
          matchesRef.current(attempt),
        );
        if (generation.current !== epoch) return;
        const completed = attemptOutbox
          .outcomes(owner)
          .find(
            (outcome) =>
              matchesRef.current(outcome.attempt) && "result" in outcome,
          );
        if (completed && "result" in completed) {
          update({
            phase: "graded",
            attempt: completed.attempt,
            result: completed.result,
            persisted: true,
          });
          return;
        }
        if (stateRef.current.phase === "graded") return;
        update(
          pending
            ? { phase: "pending_sync", attempt: pending, persisted: true }
            : { phase: "draft", persisted: false },
        );
        if (pending) void run(pending, epoch);
      })
      .catch(() => {
        if (generation.current === epoch)
          update({ phase: "draft", persisted: false });
      });
    return () => {
      generation.current++;
      unsubscribe();
    };
    // Each scope is mounted with a fixed token and occurrence identity.
  }, [token, scope]);

  const retry = () => {
    const current = stateRef.current;
    if (
      current.attempt &&
      ["pending_sync", "retryable_error"].includes(current.phase)
    )
      void run(current.attempt, generation.current);
  };

  useEffect(() => {
    if (!["pending_sync", "retryable_error"].includes(state.phase)) return;
    // A bounded retry also detects recovery on native devices without requiring
    // a new native dependency. Only one request for this attempt can be in flight.
    const timer = setInterval(() => {
      if (AppState.currentState === "active" || AppState.currentState === null)
        retry();
    }, 5000);
    const subscription = AppState.addEventListener("change", (value) => {
      if (value === "active") retry();
    });
    const online = () => retry();
    globalThis.addEventListener?.("online", online);
    return () => {
      clearInterval(timer);
      subscription.remove();
      globalThis.removeEventListener?.("online", online);
    };
  }, [state.phase, token, scope]);

  const submit = async (attempt: PendingAttempt) => {
    if (stateRef.current.phase !== "draft") return;
    const epoch = generation.current;
    update({ phase: "submitting", persisted: false });
    try {
      const owned = { ...attempt, ownerId: await attemptOwner() };
      if (generation.current !== epoch) return;
      update({ phase: "submitting", attempt: owned, persisted: false });
      await run(owned, epoch);
    } catch {
      if (generation.current === epoch)
        update({ phase: "draft", persisted: false });
    }
  };

  return { ...state, submit, retry, locked: state.phase !== "draft" };
}
