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
});
