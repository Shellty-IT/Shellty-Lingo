import type { ApiError } from "@shellty/api-contracts";

import { readSession, refreshSession } from "./session";

const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code = "REQUEST_FAILED",
    message = "API request failed",
    public readonly correlationId?: string,
  ) {
    super(message);
  }
}

export const isRetryableRequestError = (error: unknown): boolean =>
  !(error instanceof ApiRequestError) ||
  error.status === 408 ||
  error.status === 429 ||
  error.status >= 500;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
};

const errorFrom = async (response: Response): Promise<ApiRequestError> => {
  try {
    const body = (await response.json()) as Partial<ApiError>;
    if (body.error)
      return new ApiRequestError(
        response.status,
        body.error.code,
        body.error.message,
        body.error.correlationId,
      );
  } catch {
    // Non-JSON upstream failures still receive a stable client error.
  }
  return new ApiRequestError(response.status);
};

async function perform(
  path: string,
  options: RequestOptions,
  token?: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${apiUrl()}${path}`, {
      method: options.method ?? (options.body === undefined ? "GET" : "POST"),
      headers: {
        accept: "application/json",
        ...(options.body === undefined
          ? {}
          : { "content-type": "application/json" }),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const stored = options.token ? await readSession() : null;
  const accessToken = stored?.accessToken ?? options.token;
  let response = await perform(path, options, accessToken);
  if (response.status === 401 && options.token) {
    const refreshed = await refreshSession();
    response = await perform(path, options, refreshed.accessToken);
  }
  if (!response.ok) throw await errorFrom(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const idempotencyKey = (...parts: string[]): string =>
  parts
    .join(":")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9:_-]/g, "-")
    .slice(0, 100);
