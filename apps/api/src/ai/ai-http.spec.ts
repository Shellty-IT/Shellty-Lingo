import { describe, expect, it, vi } from "vitest";

import { AiHttpError, withRetry } from "./ai-http";

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
});
