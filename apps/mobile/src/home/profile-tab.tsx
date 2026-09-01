import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import type {
  BillingCatalogResponse,
  CourseLanguage,
  InterfaceLocale,
  LearningLevel,
  ProgressDashboardResponse,
  NotificationKind,
} from "@shellty/api-contracts";
import { learningLevels } from "@shellty/api-contracts";
import type { TranslationMap } from "@shellty/i18n";
import { colors } from "@shellty/ui";

import {
  useBillingCatalog,
  useRestorePurchases,
  useSandboxPurchase,
} from "../queries/billing";
import {
  usePrivacySettings,
  useRequestAccountDeletion,
  useRequestDataExport,
  useToggleNotification,
} from "../queries/operations";
import { useProgress } from "../queries/growth";
import { useUpdateCourseLevel } from "../queries/learning";
import { styles } from "./styles";

export function ProfileTab({
  token,
  language,
  locale,
  copy,
  displayName,
  email,
  onSignOut,
  onActionError,
}: {
  token: string;
  language: CourseLanguage;
  locale: InterfaceLocale;
  copy: TranslationMap;
  displayName: string;
  email: string;
  onSignOut: () => void;
  onActionError: () => void;
}) {
  const queryClient = useQueryClient();
  const privacyQuery = usePrivacySettings(token);
  const billingQuery = useBillingCatalog(token);
  const progressQuery = useProgress(token, language, locale);
  const updateCourseLevel = useUpdateCourseLevel(token);
  const toggleNotification = useToggleNotification(token);
  const restorePurchases = useRestorePurchases(token);
  const sandboxPurchase = useSandboxPurchase(token);
  const requestExport = useRequestDataExport(token);
  const requestDeletion = useRequestAccountDeletion(token);
  const [confirmDeletion, setConfirmDeletion] = useState(false);
  const [deletionScheduled, setDeletionScheduled] = useState(false);
  const [privacyMessage, setPrivacyMessage] = useState<string | null>(null);
  const [manualLevel, setManualLevel] = useState<LearningLevel | null>(null);
  const privacy = privacyQuery.data;
  const billing = billingQuery.data;
  const currentLevel = manualLevel ?? progressQuery.data?.level;

  const selectLevel = (level: LearningLevel) => {
    if (level === currentLevel || updateCourseLevel.isPending) return;
    setPrivacyMessage(null);
    updateCourseLevel.mutate(
      { language, level },
      {
        onSuccess: (result) => {
          setManualLevel(result.level);
          queryClient.setQueryData<ProgressDashboardResponse | undefined>(
            ["growth", "progress", token, language, locale],
            (current) =>
              current ? { ...current, level: result.level } : current,
          );
          void Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["learning", "dashboard", token, language],
            }),
            queryClient.invalidateQueries({
              queryKey: ["growth", "today", token, language],
            }),
            queryClient.invalidateQueries({
              queryKey: ["growth", "scenarios", token, language],
            }),
            queryClient.invalidateQueries({
              queryKey: ["listening", "challenges", token, language],
            }),
          ]);
          setPrivacyMessage(copy.levelChanged);
        },
        onError: onActionError,
      },
    );
  };

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
    sandboxPurchase.isPending ||
    requestExport.isPending ||
    requestDeletion.isPending ||
    updateCourseLevel.isPending;

  const accountPanel = (
    <>
      <Text style={styles.heading}>{copy.profile}</Text>
      <Text style={styles.sectionLabel}>{copy.account}</Text>
      <View style={styles.accountCard}>
        <View style={styles.accountAvatar} accessible={false}>
          <Text style={styles.accountAvatarText}>
            {(displayName || email).slice(0, 1).toLocaleUpperCase()}
          </Text>
        </View>
        <View style={styles.grow}>
          <Text style={styles.cardTitle}>{displayName || email}</Text>
          <Text style={styles.cardDetail}>{copy.signedInAs}</Text>
          <Text style={styles.accountEmail}>{email}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.signOut}
        style={styles.secondaryButton}
        onPress={onSignOut}
      >
        <Text style={styles.secondaryButtonText}>{copy.signOut}</Text>
      </Pressable>
      <Text style={styles.sectionLabel}>{copy.learningLevel}</Text>
      <View style={styles.levelSettingsCard}>
        <Text style={styles.cardTitle}>{copy.learningLevel}</Text>
        <Text style={styles.cardDetail}>{copy.learningLevelBody}</Text>
        <Text style={styles.levelCurrent}>
          {copy.levelLabel}:{" "}
          {currentLevel ?? (progressQuery.isLoading ? copy.loading : "—")}
        </Text>
        <View accessibilityRole="radiogroup" style={styles.levelPicker}>
          {learningLevels.map((level) => {
            const selected = currentLevel === level;
            return (
              <Pressable
                key={level}
                accessibilityRole="radio"
                accessibilityLabel={`${copy.levelLabel} ${level}`}
                accessibilityState={{
                  checked: selected,
                  disabled: updateCourseLevel.isPending,
                }}
                disabled={updateCourseLevel.isPending}
                onPress={() => selectLevel(level)}
                style={[
                  styles.levelOption,
                  selected && styles.levelOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.levelOptionText,
                    selected && styles.levelOptionTextActive,
                  ]}
                >
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {currentLevel === "C1" ? (
          <Text style={styles.cardDetail}>{copy.c1ManualLevelNotice}</Text>
        ) : null}
      </View>
    </>
  );

  if (
    (privacyQuery.isLoading || billingQuery.isLoading) &&
    (!privacy || !billing)
  )
    return (
      <View style={styles.section}>
        {accountPanel}
        <ActivityIndicator color={colors.actionPrimary} />
      </View>
    );
  if ((privacyQuery.isError || billingQuery.isError) && (!privacy || !billing))
    return (
      <View style={styles.section}>
        {accountPanel}
        <Text accessibilityRole="alert" style={styles.error}>
          {copy.noData}
        </Text>
      </View>
    );

  return (
    <View style={styles.section}>
      {accountPanel}
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
                  {product.displayPrice} ·{" "}
                  {product.period === "month"
                    ? copy.billingMonth
                    : copy.billingYear}
                  {` · ${product.trialDays} ${copy.trialDays}`}
                </Text>
              </View>
              {process.env.EXPO_PUBLIC_BILLING_SANDBOX === "true" ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.sandboxBuy}
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
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
        accessibilityState={{ disabled: busy }}
        disabled={busy}
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
            accessibilityState={{
              checked: preference.enabled,
              disabled: busy,
            }}
            disabled={busy}
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
                {preference.localTime} · {copy.quietHours}{" "}
                {preference.quietHours.start}–{preference.quietHours.end}
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
          v{privacy?.policyVersion ?? "–"} · {copy.exportWindow}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.requestExport}
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        style={styles.secondaryButton}
        onPress={() =>
          requestExport.mutate(undefined, {
            onSuccess: () => setPrivacyMessage(copy.exportRequested),
            onError: onActionError,
          })
        }
      >
        <Text style={styles.secondaryButtonText}>{copy.requestExport}</Text>
      </Pressable>
      {confirmDeletion ? (
        <View style={styles.dangerCard}>
          <Text style={styles.cardTitle}>{copy.deletionConfirmTitle}</Text>
          <Text style={styles.cardDetail}>{copy.deletionConfirmBody}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.deletionConfirm}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            style={styles.dangerButton}
            onPress={() =>
              requestDeletion.mutate(undefined, {
                onSuccess: () => {
                  setConfirmDeletion(false);
                  setDeletionScheduled(true);
                  setPrivacyMessage(copy.deletionScheduled);
                },
                onError: onActionError,
              })
            }
          >
            <Text style={styles.dangerButtonText}>{copy.deletionConfirm}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.deletionCancel}
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            style={styles.secondaryButton}
            onPress={() => setConfirmDeletion(false)}
          >
            <Text style={styles.secondaryButtonText}>
              {copy.deletionCancel}
            </Text>
          </Pressable>
        </View>
      ) : !deletionScheduled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.requestDeletion}
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          style={styles.deletionLink}
          onPress={() => {
            setPrivacyMessage(null);
            setConfirmDeletion(true);
          }}
        >
          <Text style={styles.deletionLinkText}>{copy.requestDeletion}</Text>
        </Pressable>
      ) : null}
      {privacyMessage ? (
        <Text accessibilityRole="alert" style={styles.successMessage}>
          {privacyMessage}
        </Text>
      ) : null}
      {busy ? <ActivityIndicator color={colors.actionPrimary} /> : null}
    </View>
  );
}
