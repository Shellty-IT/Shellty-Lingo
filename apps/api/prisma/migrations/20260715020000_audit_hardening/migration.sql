ALTER TABLE "user_profiles"
  ADD COLUMN "active_course_language" VARCHAR(10);

ALTER TABLE "user_courses"
  ADD COLUMN "timezone" VARCHAR(100) NOT NULL DEFAULT 'UTC';

ALTER TABLE "learning_sessions"
  ADD COLUMN "content_revision_id" UUID;

UPDATE "learning_sessions" AS session
SET "content_revision_id" = lesson."published_revision_id"
FROM "lessons" AS lesson
WHERE session."lesson_id" = lesson."id"
  AND session."kind" = 'lesson';

CREATE INDEX "learning_sessions_content_revision_id_idx"
  ON "learning_sessions"("content_revision_id");
ALTER TABLE "learning_sessions"
  ADD CONSTRAINT "learning_sessions_content_revision_id_fkey"
  FOREIGN KEY ("content_revision_id") REFERENCES "content_revisions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "exercise_attempts"
  ADD COLUMN "request_hash" VARCHAR(64) NOT NULL DEFAULT '';
ALTER TABLE "exercise_attempts" ALTER COLUMN "request_hash" DROP DEFAULT;
CREATE UNIQUE INDEX "exercise_attempts_session_id_exercise_id_key"
  ON "exercise_attempts"("session_id", "exercise_id");

ALTER TABLE "review_items"
  ADD COLUMN "algorithm_version" VARCHAR(30) NOT NULL DEFAULT 'srs-v1',
  ADD COLUMN "last_result" "ReviewRating";

ALTER TABLE "review_attempts"
  ADD COLUMN "interval_minutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "algorithm_version" VARCHAR(30) NOT NULL DEFAULT 'srs-v1';
ALTER TABLE "review_attempts" ALTER COLUMN "interval_minutes" DROP DEFAULT;

ALTER TABLE "learning_events"
  ADD COLUMN "idempotency_key" VARCHAR(100);
CREATE UNIQUE INDEX "learning_events_user_id_idempotency_key_key"
  ON "learning_events"("user_id", "idempotency_key");

ALTER TABLE "ai_conversation_messages"
  ADD COLUMN "turn_key" VARCHAR(100),
  ADD COLUMN "request_hash" VARCHAR(64);
CREATE UNIQUE INDEX "ai_conversation_messages_conversation_id_role_turn_key_key"
  ON "ai_conversation_messages"("conversation_id", "role", "turn_key");

ALTER TABLE "ai_conversations"
  ADD COLUMN "idempotency_key" VARCHAR(100),
  ADD COLUMN "request_hash" VARCHAR(64);
CREATE UNIQUE INDEX "ai_conversations_user_course_id_idempotency_key_key"
  ON "ai_conversations"("user_course_id", "idempotency_key");

ALTER TABLE "refresh_tokens"
  ADD CONSTRAINT "refresh_tokens_replaced_by_id_fkey"
  FOREIGN KEY ("replaced_by_id") REFERENCES "refresh_tokens"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "consents_user_id_key_version_key";
CREATE INDEX "consents_user_id_key_version_created_at_idx"
  ON "consents"("user_id", "key", "version", "created_at");
