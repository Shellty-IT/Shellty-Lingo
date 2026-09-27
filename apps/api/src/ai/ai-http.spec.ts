import { describe, expect, it, vi } from "vitest";

import { AiHttpError, assertAiHttpResponse, withRetry } from "./ai-http";

describe("AI HTTP retry policy", () => {
  it("does not retry invalid credentials or retired model ids", async () => {
    const operation = vi.fn().mockRejectedValue(new AiHttpError("AI", 404));

    await expect(withRetry(operation, 3)).rejects.toMatchObject({
      status: 404,
    });
    expect(operation).toHaveBeenCalledOnce();
  });

  it("retries rate limits and transient provider failures", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new AiHttpError("AI", 429))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, 1)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("allows an immediate model failover instead of retrying a quota error", async () => {
    const operation = vi.fn().mockRejectedValue(new AiHttpError("AI", 429));
    await expect(
      withRetry(operation, 3, { failoverOnRateLimit: true }),
    ).rejects.toMatchObject({ status: 429 });
    expect(operation).toHaveBeenCalledOnce();
  });

  it("preserves Retry-After without retaining the provider response body", () => {
    expect(() =>
      assertAiHttpResponse(
        new Response("sensitive provider body", {
          status: 429,
          headers: { "retry-after": "120" },
        }),
        "AI",
      ),
    ).toThrow(expect.objectContaining({ status: 429, retryAfterMs: 120000 }));
  });
});
