const apiUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/v1";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message = "API request failed",
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown; token?: string } = {},
): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    method: options.method ?? (options.body === undefined ? "GET" : "POST"),
    headers: {
      accept: "application/json",
      ...(options.body === undefined
        ? {}
        : { "content-type": "application/json" }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
  });
  if (!response.ok) throw new ApiRequestError(response.status);
  return response.json() as Promise<T>;
}

export const idempotencyKey = (...parts: string[]): string =>
  parts
    .join(":")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9:_-]/g, "-")
    .slice(0, 100);
