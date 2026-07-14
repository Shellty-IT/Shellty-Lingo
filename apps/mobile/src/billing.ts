import type {
  BillingProduct,
  BillingStore,
  PlanAccessResponse,
} from "@shellty/api-contracts";
import { apiRequest } from "./api";

export interface NativePurchase {
  store: BillingStore;
  productId: BillingProduct["id"];
  transactionId: string;
  receipt: string;
}

export const verifyNativePurchase = (
  token: string,
  purchase: NativePurchase,
): Promise<PlanAccessResponse> =>
  apiRequest<PlanAccessResponse>("/billing/transactions/verify", {
    method: "POST",
    token,
    body: purchase,
  });

export const restorePurchases = (token: string): Promise<PlanAccessResponse> =>
  apiRequest<PlanAccessResponse>("/billing/restore", {
    method: "POST",
    token,
  });

export async function activateDevelopmentPurchase(
  token: string,
  product: BillingProduct,
): Promise<PlanAccessResponse> {
  if (process.env.EXPO_PUBLIC_BILLING_SANDBOX !== "true")
    throw new Error("Sandbox purchases are disabled.");
  const store: BillingStore = "google";
  const transactionId = `dev-${Date.now()}`;
  const days = product.period === "year" ? 365 : 30;
  const periodEnd = new Date(Date.now() + days * 86400000).toISOString();
  return verifyNativePurchase(token, {
    store,
    productId: product.id,
    transactionId,
    receipt: `sandbox:${store}:${product.id}:${transactionId}:${periodEnd}`,
  });
}
