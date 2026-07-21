/** Shared HTTP concerns for AI adapters: bounded timeout and limited retry. */

export interface AiHttpOptions {
  timeoutMs: number;
  maxRetries: number;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Run an operation with a limited number of retries and jittered backoff.
 * Retries any thrown error (timeout, network, non-2xx mapped to throw). The
 * caller's circuit breaker decides when to stop trying a provider entirely.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) await delay(backoffMs(attempt));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("AI request failed.");
}

function backoffMs(attempt: number): number {
  const base = 250 * 2 ** attempt;
  return base + Math.floor(Math.random() * 200);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
