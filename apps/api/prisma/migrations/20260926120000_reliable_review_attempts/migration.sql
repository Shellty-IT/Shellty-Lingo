ALTER TABLE "review_items"
ADD COLUMN "schedule_revision" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "review_attempts"
ADD COLUMN "request_hash" VARCHAR(64),
ADD COLUMN "schedule_revision" INTEGER;

-- Existing attempts retain their original payload semantics. New requests
-- bind their idempotency key to both the rating and the schedule revision.
