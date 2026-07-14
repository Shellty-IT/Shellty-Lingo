CREATE TYPE "ThaiUnitKind" AS ENUM ('consonant', 'vowel', 'syllable', 'digit', 'tone_rule');
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'completed', 'blocked');
CREATE TYPE "ConversationRole" AS ENUM ('learner', 'assistant');

CREATE TABLE "thai_script_units" (
  "id" UUID NOT NULL,
  "kind" "ThaiUnitKind" NOT NULL,
  "glyph" VARCHAR(30) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "transliteration" VARCHAR(120) NOT NULL,
  "meaning" VARCHAR(200) NOT NULL,
  "tone_class" VARCHAR(20),
  "tone" VARCHAR(20),
  "audio_url" TEXT,
  "example" JSONB NOT NULL,
  "position" INTEGER NOT NULL,
  "expert_reviewed" BOOLEAN NOT NULL DEFAULT false,
  "published" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "thai_script_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_prompt_versions" (
  "id" UUID NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "version" INTEGER NOT NULL,
  "system_prompt" TEXT NOT NULL,
  "response_schema" JSONB NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_prompt_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_conversations" (
  "id" UUID NOT NULL,
  "user_course_id" UUID NOT NULL,
  "prompt_version_id" UUID NOT NULL,
  "scenario_id" VARCHAR(80) NOT NULL,
  "correction_mode" VARCHAR(40) NOT NULL,
  "level" VARCHAR(20) NOT NULL,
  "status" "ConversationStatus" NOT NULL DEFAULT 'active',
  "message_limit" INTEGER NOT NULL DEFAULT 12,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "estimated_cost_usd" DECIMAL(10,6) NOT NULL DEFAULT 0,
  "summary" JSONB,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_conversation_messages" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "role" "ConversationRole" NOT NULL,
  "text" TEXT NOT NULL,
  "correction" JSONB,
  "moderation" JSONB NOT NULL DEFAULT '{}',
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_reports" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "reporter_id" UUID NOT NULL,
  "reason" VARCHAR(80) NOT NULL,
  "details" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_reports_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "thai_script_units_kind_glyph_key" ON "thai_script_units"("kind", "glyph");
CREATE INDEX "thai_script_units_published_position_idx" ON "thai_script_units"("published", "position");
CREATE UNIQUE INDEX "ai_prompt_versions_key_version_key" ON "ai_prompt_versions"("key", "version");
CREATE INDEX "ai_prompt_versions_key_active_idx" ON "ai_prompt_versions"("key", "active");
CREATE INDEX "ai_conversations_user_course_id_status_started_at_idx" ON "ai_conversations"("user_course_id", "status", "started_at");
CREATE INDEX "ai_conversation_messages_conversation_id_created_at_idx" ON "ai_conversation_messages"("conversation_id", "created_at");
CREATE INDEX "conversation_reports_status_created_at_idx" ON "conversation_reports"("status", "created_at");

ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_course_id_fkey" FOREIGN KEY ("user_course_id") REFERENCES "user_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_prompt_version_id_fkey" FOREIGN KEY ("prompt_version_id") REFERENCES "ai_prompt_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_conversation_messages" ADD CONSTRAINT "ai_conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversation_reports" ADD CONSTRAINT "conversation_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
