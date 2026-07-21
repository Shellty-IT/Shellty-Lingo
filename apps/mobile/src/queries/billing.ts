import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  BillingCatalogResponse,
  BillingProduct,
} from "@shellty/api-contracts";

import { apiRequest } from "../api";
import { activateDevelopmentPurchase, restorePurchases } from "../billing";

export function useBillingCatalog(token: string) {
  return useQuery({
    queryKey: ["billing", "catalog", token],
    queryFn: () =>
      apiRequest<BillingCatalogResponse>("/billing/catalog", { token }),
  });
}

export function useRestorePurchases(token: string) {
  return useMutation({ mutationFn: () => restorePurchases(token) });
}

export function useSandboxPurchase(token: string) {
  return useMutation({
    mutationFn: (product: BillingProduct) =>
      activateDevelopmentPurchase(token, product),
  });
}
