import type { SessionResponse } from "@shellty/api-contracts";
import * as SecureStore from "expo-secure-store";

const key = "shellty.session.v1";
const listeners = new Set<() => void>();
let refreshInFlight: Promise<StoredSession> | null = null;

export type StoredSession = SessionResponse;

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/v1";

const post = async (path: string, body: unknown): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${apiUrl()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const isStoredSession = (value: unknown): value is StoredSession => {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<StoredSession>;
  return (
    typeof session.accessToken === "string" &&
    typeof session.refreshToken === "string" &&
    typeof session.user?.id === "string" &&
    typeof session.user?.email === "string"
  );
};

export async function readSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isStoredSession(parsed)) return parsed;
  } catch {
    // A corrupt or obsolete secure-store value must not block app startup.
  }
  await SecureStore.deleteItemAsync(key);
  return null;
}

export function saveSession(session: StoredSession): Promise<void> {
  return SecureStore.setItemAsync(key, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(key);
  for (const listener of listeners) listener();
}

export function onSessionCleared(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function refreshSession(): Promise<StoredSession> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const current = await readSession();
    if (!current) throw new Error("No refresh session is available.");
    const response = await post("/auth/refresh", {
      refreshToken: current.refreshToken,
    });
    if (!response.ok) {
      if ([400, 401, 403].includes(response.status)) await clearSession();
      throw new Error("Session refresh failed.");
    }
    const next = (await response.json()) as StoredSession;
    if (!isStoredSession(next)) {
      await clearSession();
      throw new Error("Session refresh returned an invalid response.");
    }
    await saveSession(next);
    return next;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function logoutSession(): Promise<void> {
  const current = await readSession();
  try {
    if (current)
      await post("/auth/logout", { refreshToken: current.refreshToken });
  } finally {
    await clearSession();
  }
}
