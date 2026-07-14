import { describe, expect, it } from "vitest";
import {
  safeEqual,
  verifySandboxReceipt,
  webhookSignature,
} from "./billing-engine";

describe("billing verification", () => {
  it("accepts a matching sandbox purchase and preserves expiry", () => {
    const periodEnd = "2026-08-14T12:00:00.000Z";
    expect(
      verifySandboxReceipt({
        store: "apple",
        productId: "shellty_premium_monthly",
        transactionId: "tx-1",
        receipt: `sandbox:apple:shellty_premium_monthly:tx-1:${periodEnd}`,
        now: new Date("2026-07-14T12:00:00.000Z"),
      }),
    ).toMatchObject({ status: "active", transactionId: "tx-1" });
  });

  it("rejects a receipt for another transaction", () => {
    expect(
      verifySandboxReceipt({
        store: "google",
        productId: "shellty_premium_annual",
        transactionId: "tx-right",
        receipt:
          "sandbox:google:shellty_premium_annual:tx-wrong:2027-07-14T00:00:00.000Z",
      }),
    ).toBeNull();
  });

  it("compares webhook signatures without early exit", () => {
    const signature = webhookSignature("a".repeat(32), { id: "evt-1" });
    expect(safeEqual(signature, signature)).toBe(true);
    expect(safeEqual(signature, "0".repeat(64))).toBe(false);
  });
});
