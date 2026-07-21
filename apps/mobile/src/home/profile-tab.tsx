import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type {
  BillingCatalogResponse,
  NotificationKind,
} from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import {
  useBillingCatalog,
  useRestorePurchases,
  useSandboxPurchase,
} from "../queries/billing";
import {
  usePrivacySettings,
  useToggleNotification,
} from "../queries/operations";
import { styles } from "./styles";

export function ProfileTab({
  token,
  copy,
  onActionError,
}: {
  token: string;
  copy: TranslationMap;
  onActionError: () => void;
}) {
  const queryClient = useQueryClient();
  const privacyQuery = usePrivacySettings(token);
  const billingQuery = useBillingCatalog(token);
  const toggleNotification = useToggleNotification(token);
  const restorePurchases = useRestorePurchases(token);
  const sandboxPurchase = useSandboxPurchase(token);
  const privacy = privacyQuery.data;
  const billing = billingQuery.data;

  const applyAccess = (access: BillingCatalogResponse["access"]) =>
    queryClient.setQueryData<BillingCatalogResponse | undefined>(
      ["billing", "catalog", token],
      (current) => (current ? { ...current, access } : current),
    );

  const reminderLabel: Record<NotificationKind, string> = {
    learning_reminder: copy.reminderLearning,
    review_due: copy.reminderReviews,
    product_updates: copy.reminderProduct,
  };

  const busy =
    toggleNotification.isPending ||
    restorePurchases.isPending ||
    sandboxPurchase.isPending;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{copy.profile}</Text>
      <View style={styles.premiumHero}>
        <View style={styles.planPill}>
          <Text style={styles.planPillText}>
            {billing?.access.plan === "premium"
              ? copy.activePlan
              : copy.freePlan}
          </Text>
        </View>
        <Text style={styles.premiumTitle}>{copy.premium}</Text>
        <Text style={styles.premiumText}>{copy.premiumBody}</Text>
        <Text style={styles.usageText}>
          AI · {billing?.access.limits.aiMessagesUsedToday ?? 0}/
          {billing?.access.limits.aiMessagesPerDay ?? 5}
        </Text>
      </View>
      {billing?.access.plan !== "premium"
        ? billing?.products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <View style={styles.grow}>
                <Text style={styles.cardTitle}>{product.title}</Text>
                <Text style={styles.cardDetail}>
                  {product.displayPrice} · {product.period}
                </Text>
              </View>
              {process.env.EXPO_PUBLIC_BILLING_SANDBOX === "true" ? (
                <Pressable
                  accessibilityRole="button"
                  style={styles.smallButton}
                  onPress={() =>
                    sandboxPurchase.mutate(product, {
                      onSuccess: applyAccess,
                      onError: onActionError,
                    })
                  }
                >
                  <Text style={styles.smallButtonText}>{copy.sandboxBuy}</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.restore}
        onPress={() =>
          restorePurchases.mutate(undefined, {
            onSuccess: applyAccess,
            onError: onActionError,
          })
        }
      >
        <Text style={styles.finish}>{copy.restore}</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>{copy.reminders}</Text>
      <View style={styles.settingsGroup}>
        {privacy?.preferences.map((preference, index) => (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: preference.enabled }}
            key={preference.kind}
            style={[
              styles.settingRow,
              index < privacy.preferences.length - 1 && styles.settingBorder,
            ]}
            onPress={() => {
              const timezone =
                Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
              toggleNotification.mutate(
                {
                  kind: preference.kind,
                  enabled: !preference.enabled,
                  localTime: preference.localTime,
                  timezone,
                  quietHoursStart: preference.quietHours.start,
                  quietHoursEnd: preference.quietHours.end,
                },
                { onError: onActionError },
              );
            }}
          >
            <View style={styles.grow}>
              <Text style={styles.cardTitle}>
                {reminderLabel[preference.kind]}
              </Text>
              <Text style={styles.cardDetail}>
                {preference.localTime} · {copy.quietHours}
              </Text>
            </View>
            <View
              style={[
                styles.switchTrack,
                preference.enabled && styles.switchTrackActive,
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  preference.enabled && styles.switchThumbActive,
                ]}
              />
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={styles.sectionLabel}>{copy.privacy}</Text>
      <View style={styles.info}>
        <Text style={styles.cardTitle}>{copy.privacy}</Text>
        <Text style={styles.cardDetail}>{copy.retention}</Text>
        <Text style={styles.policyMeta}>
          v{privacy?.policyVersion ?? "–"} · export 24 h
        </Text>
      </View>
      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}
