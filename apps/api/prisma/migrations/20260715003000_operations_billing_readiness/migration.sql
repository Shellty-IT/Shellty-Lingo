CREATE TYPE "NotificationKind" AS ENUM ('learning_reminder', 'review_due', 'product_updates');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('queued', 'sent', 'failed', 'suppressed');
CREATE TYPE "BillingStore" AS ENUM ('apple', 'google');
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'grace_period', 'expired', 'refunded', 'cancelled');
CREATE TYPE "BillingEventStatus" AS ENUM ('received', 'processed', 'rejected');
CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_review', 'resolved');

ALTER TABLE "lessons" ADD COLUMN "premium" BOOLEAN NOT NULL DEFAULT false;
DROP INDEX IF EXISTS "consents_user_id_key_idx";
CREATE UNIQUE INDEX "consents_user_id_key_version_key" ON "consents"("user_id", "key", "version");

CREATE TABLE "notification_preferences" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "kind" "NotificationKind" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false, "local_time" VARCHAR(5) NOT NULL DEFAULT '19:00',
  "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC', "quiet_hours_start" VARCHAR(5) NOT NULL DEFAULT '22:00',
  "quiet_hours_end" VARCHAR(5) NOT NULL DEFAULT '07:00', "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "notification_preferences_user_id_kind_key" ON "notification_preferences"("user_id", "kind");
CREATE INDEX "notification_preferences_enabled_kind_idx" ON "notification_preferences"("enabled", "kind");

CREATE TABLE "notification_deliveries" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "preference_id" UUID NOT NULL,
  "idempotency_key" VARCHAR(160) NOT NULL, "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'queued',
  "scheduled_at" TIMESTAMP(3) NOT NULL, "sent_at" TIMESTAMP(3), "failure_code" VARCHAR(80),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notification_deliveries_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "notification_preferences"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "notification_deliveries_idempotency_key_key" ON "notification_deliveries"("idempotency_key");
CREATE INDEX "notification_deliveries_status_scheduled_at_idx" ON "notification_deliveries"("status", "scheduled_at");

CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "store" "BillingStore" NOT NULL,
  "product_id" VARCHAR(120) NOT NULL, "original_transaction_id" VARCHAR(200) NOT NULL,
  "status" "SubscriptionStatus" NOT NULL, "current_period_end" TIMESTAMP(3) NOT NULL,
  "auto_renewing" BOOLEAN NOT NULL DEFAULT true, "environment" VARCHAR(20) NOT NULL DEFAULT 'sandbox',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "subscriptions_store_original_transaction_id_key" ON "subscriptions"("store", "original_transaction_id");
CREATE INDEX "subscriptions_user_id_status_current_period_end_idx" ON "subscriptions"("user_id", "status", "current_period_end");

CREATE TABLE "entitlements" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "key" VARCHAR(80) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT false,
  "expires_at" TIMESTAMP(3), "source" VARCHAR(40) NOT NULL, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "entitlements_user_id_key_key" ON "entitlements"("user_id", "key");
CREATE INDEX "entitlements_key_active_idx" ON "entitlements"("key", "active");

CREATE TABLE "billing_events" (
  "id" UUID NOT NULL, "store" "BillingStore" NOT NULL, "external_id" VARCHAR(200) NOT NULL,
  "event_type" VARCHAR(80) NOT NULL, "payload_hash" VARCHAR(128) NOT NULL,
  "status" "BillingEventStatus" NOT NULL DEFAULT 'received', "processed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "billing_events_store_external_id_key" ON "billing_events"("store", "external_id");
CREATE INDEX "billing_events_status_created_at_idx" ON "billing_events"("status", "created_at");

CREATE TABLE "support_tickets" (
  "id" UUID NOT NULL, "user_id" UUID NOT NULL, "category" VARCHAR(50) NOT NULL,
  "subject" VARCHAR(160) NOT NULL, "message" TEXT NOT NULL, "status" "SupportTicketStatus" NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "support_tickets_status_created_at_idx" ON "support_tickets"("status", "created_at");
