import { createHmac, timingSafeEqual } from "node:crypto";
import type { BillingStore, SubscriptionStatus } from "@shellty/api-contracts";

export const productIds = [
  "shellty_premium_monthly",
  "shellty_premium_annual",
] as const;
export type ProductId = (typeof productIds)[number];

export interface VerifiedPurchase {
  store: BillingStore;
  productId: ProductId;
  transactionId: string;
  status: SubscriptionStatus;
  periodEnd: Date;
  environment: "sandbox" | "production";
}

export const safeEqual = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
};

export const webhookSignature = (secret: string, payload: unknown): string =>
  createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");

export function verifySandboxReceipt(input: {
  store: BillingStore;
  productId: string;
  transactionId: string;
  receipt: string;
  now?: Date;
}): VerifiedPurchase | null {
  if (!productIds.includes(input.productId as ProductId)) return null;
  const prefix = `sandbox:${input.store}:${input.productId}:${input.transactionId}:`;
  if (!input.receipt.startsWith(prefix)) return null;
  const periodEnd = new Date(input.receipt.slice(prefix.length));
  if (!Number.isFinite(periodEnd.getTime())) return null;
  const now = input.now ?? new Date();
  return {
    store: input.store,
    productId: input.productId as ProductId,
    transactionId: input.transactionId,
    status: periodEnd > now ? "active" : "expired",
    periodEnd,
    environment: "sandbox",
  };
}
