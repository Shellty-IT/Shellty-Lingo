import { HttpException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { webhookSignature } from "./billing-engine";
import { BillingService } from "./billing.service";

const environment = {
  BILLING_WEBHOOK_SECRET: "test-billing-secret-at-least-32-characters",
  BILLING_SANDBOX_ENABLED: true,
};

describe("BillingService", () => {
  it("enforces the free AI limit on the server", async () => {
    const prisma = {
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
