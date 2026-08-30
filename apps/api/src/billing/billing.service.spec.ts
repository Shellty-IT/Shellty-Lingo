import { HttpException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { webhookSignature } from "./billing-engine";
import { BillingService } from "./billing.service";

const environment = {
  BILLING_WEBHOOK_SECRET: "test-billing-secret-at-least-32-characters",
  BILLING_SANDBOX_ENABLED: true,
};

describe("BillingService", () => {
  it("counts AI messages within the learner's local day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T21:30:00.000Z"));
    const count = vi.fn().mockResolvedValue(0);
    const prisma = {
      userProfile: {
        findUnique: vi.fn().mockResolvedValue({ activeCourseLanguage: "en" }),
      },
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({ timezone: "Europe/Warsaw" }),
      },
      subscription: { findFirst: vi.fn().mockResolvedValue(null) },
      aiConversationMessage: { count },
    };
    const service = new BillingService(prisma as never, environment as never);

    try {
      await service.access("user-1");
      const countInput = count.mock.calls[0]?.[0] as
        | { where: { createdAt: { gte: Date; lt: Date } } }
        | undefined;
      expect(countInput?.where.createdAt).toEqual({
        gte: new Date("2026-07-13T22:00:00.000Z"),
        lt: new Date("2026-07-14T22:00:00.000Z"),
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("enforces the free AI limit on the server", async () => {
    const prisma = {
      userProfile: {
        findUnique: vi.fn().mockResolvedValue({ activeCourseLanguage: "en" }),
      },
      userCourse: {
        findUnique: vi.fn().mockResolvedValue({ timezone: "Europe/Warsaw" }),
      },
      subscription: { findFirst: vi.fn().mockResolvedValue(null) },
      aiConversationMessage: { count: vi.fn().mockResolvedValue(5) },
    };
    const service = new BillingService(prisma as never, environment as never);

    await expect(
      service.assertAiMessageAllowed("user-1"),
    ).rejects.toBeInstanceOf(HttpException);
  });

  it("allows premium lessons during grace period", async () => {
    const prisma = {
      userProfile: { findUnique: vi.fn().mockResolvedValue(null) },
      userCourse: { findUnique: vi.fn() },
      subscription: {
        findFirst: vi.fn().mockResolvedValue({
          status: "grace_period",
          currentPeriodEnd: new Date("2027-01-01T00:00:00.000Z"),
          store: "apple",
        }),
      },
      aiConversationMessage: { count: vi.fn().mockResolvedValue(8) },
    };
    const service = new BillingService(prisma as never, environment as never);

    await expect(
      service.assertPremiumContentAllowed("user-1"),
    ).resolves.toBeUndefined();
  });

  it("acknowledges a duplicated signed webhook without applying it twice", async () => {
    const event = {
      id: "evt-1",
      type: "renewal",
      originalTransactionId: "tx-1",
      status: "active",
      periodEnd: "2026-08-14T00:00:00.000Z",
    };
    const prisma = {
      billingEvent: {
        findUnique: vi.fn().mockResolvedValue({ id: "recorded" }),
      },
    };
    const service = new BillingService(prisma as never, environment as never);

    await expect(
      service.webhook(
        "google",
        webhookSignature(environment.BILLING_WEBHOOK_SECRET, event),
        event,
      ),
    ).resolves.toEqual({ accepted: true, duplicate: true });
  });
});
