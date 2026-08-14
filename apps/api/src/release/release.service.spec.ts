import { describe, expect, it, vi } from "vitest";

import { ReleaseService } from "./release.service";

const prisma = {
  systemMetadata: { findMany: vi.fn().mockResolvedValue([]) },
};

describe("ReleaseService fail-closed defaults", () => {
  it("keeps the placeholder AI adapter disabled in production", async () => {
    const service = new ReleaseService(
      prisma as never,
      { warn: vi.fn() } as never,
      { APP_ENV: "production" } as never,
    );

    const config = await service.config("learner-1");

    expect(
      config.flags.find((flag) => flag.key === "ai_conversations"),
    ).toMatchObject({ enabled: false, rolloutPercent: 0, available: false });
  });

  it("enables AI conversation and voice defaults when a production provider is configured", async () => {
    const service = new ReleaseService(
      prisma as never,
      { warn: vi.fn() } as never,
      { APP_ENV: "production", GEMINI_API_KEY: "configured" } as never,
    );

    const config = await service.config("learner-1");

    expect(
      config.flags.find((flag) => flag.key === "ai_conversations"),
    ).toMatchObject({ enabled: true, rolloutPercent: 100, available: true });
    expect(
      config.flags.find((flag) => flag.key === "async_speaking"),
    ).toMatchObject({ enabled: true, rolloutPercent: 100, available: true });
  });
});
