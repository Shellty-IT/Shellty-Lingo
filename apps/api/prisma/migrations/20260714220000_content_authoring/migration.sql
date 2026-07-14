CREATE TYPE "ContentStatus" AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE "ExerciseType" AS ENUM ('single_choice', 'multiple_choice', 'matching', 'gap_fill', 'typed_answer', 'ordering', 'listening');
CREATE TYPE "MediaKind" AS ENUM ('audio', 'illustration');

CREATE TABLE "courses" (
  "id" UUID NOT NULL, "slug" VARCHAR(100) NOT NULL, "language" VARCHAR(10) NOT NULL,
  "level" VARCHAR(20) NOT NULL, "title" VARCHAR(200) NOT NULL, "description" TEXT,
  "status" "ContentStatus" NOT NULL DEFAULT 'draft', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE INDEX "courses_language_status_idx" ON "courses"("language", "status");
CREATE TABLE "course_modules" (
  "id" UUID NOT NULL, "course_id" UUID NOT NULL, "slug" VARCHAR(100) NOT NULL, "title" VARCHAR(200) NOT NULL,
  "position" INTEGER NOT NULL, "status" "ContentStatus" NOT NULL DEFAULT 'draft', CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "course_modules_course_id_slug_key" ON "course_modules"("course_id", "slug");
CREATE UNIQUE INDEX "course_modules_course_id_position_key" ON "course_modules"("course_id", "position");
CREATE TABLE "lessons" (
  "id" UUID NOT NULL, "module_id" UUID NOT NULL, "slug" VARCHAR(100) NOT NULL, "position" INTEGER NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'draft', "published_revision_id" UUID, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL, CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lessons_module_id_slug_key" ON "lessons"("module_id", "slug");
CREATE UNIQUE INDEX "lessons_module_id_position_key" ON "lessons"("module_id", "position");
CREATE UNIQUE INDEX "lessons_published_revision_id_key" ON "lessons"("published_revision_id");
CREATE TABLE "content_revisions" (
  "id" UUID NOT NULL, "lesson_id" UUID NOT NULL, "version" INTEGER NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'draft', "title" VARCHAR(200) NOT NULL, "summary" TEXT,
  "estimated_minutes" INTEGER NOT NULL, "completeness" JSONB NOT NULL DEFAULT '{}', "review_note" TEXT,
  "reviewed_at" TIMESTAMP(3), "reviewed_by_id" UUID, "published_at" TIMESTAMP(3), "published_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "content_revisions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "content_revisions_lesson_id_version_key" ON "content_revisions"("lesson_id", "version");
CREATE INDEX "content_revisions_status_idx" ON "content_revisions"("status");
CREATE TABLE "media_assets" (
  "id" UUID NOT NULL, "kind" "MediaKind" NOT NULL, "storage_key" VARCHAR(500) NOT NULL,
  "content_type" VARCHAR(100) NOT NULL, "byte_size" INTEGER NOT NULL, "duration_ms" INTEGER, "alt_text" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");
CREATE TABLE "exercises" (
  "id" UUID NOT NULL, "revision_id" UUID NOT NULL, "position" INTEGER NOT NULL, "type" "ExerciseType" NOT NULL,
  "prompt" TEXT NOT NULL, "instructions" TEXT, "options" JSONB, "answer" JSONB NOT NULL, "explanation" TEXT,
  "media_asset_id" UUID, CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "exercises_revision_id_position_key" ON "exercises"("revision_id", "position");
CREATE TABLE "vocabulary_entries" (
  "id" UUID NOT NULL, "language" VARCHAR(10) NOT NULL, "term" VARCHAR(300) NOT NULL,
  "part_of_speech" VARCHAR(50), "definition" TEXT NOT NULL, "transliteration" VARCHAR(500), "tone_marks" VARCHAR(500),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "vocabulary_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vocabulary_entries_language_term_key" ON "vocabulary_entries"("language", "term");
CREATE TABLE "pronunciation_variants" (
  "id" UUID NOT NULL, "vocabulary_id" UUID NOT NULL, "label" VARCHAR(100), "ipa" VARCHAR(500),
  "transliteration" VARCHAR(500), "tone_marks" VARCHAR(500), "audio_asset_id" UUID,
  CONSTRAINT "pronunciation_variants_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "grammar_topics" (
  "id" UUID NOT NULL, "language" VARCHAR(10) NOT NULL, "slug" VARCHAR(100) NOT NULL,
  "title" VARCHAR(200) NOT NULL, "explanation" TEXT NOT NULL, CONSTRAINT "grammar_topics_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "grammar_topics_language_slug_key" ON "grammar_topics"("language", "slug");
CREATE TABLE "lesson_vocabulary" ("revision_id" UUID NOT NULL, "vocabulary_id" UUID NOT NULL, CONSTRAINT "lesson_vocabulary_pkey" PRIMARY KEY ("revision_id", "vocabulary_id"));
CREATE TABLE "lesson_grammar" ("revision_id" UUID NOT NULL, "grammar_id" UUID NOT NULL, CONSTRAINT "lesson_grammar_pkey" PRIMARY KEY ("revision_id", "grammar_id"));
CREATE TABLE "translations" (
  "id" UUID NOT NULL, "entity_type" VARCHAR(50) NOT NULL, "entity_id" UUID NOT NULL, "locale" VARCHAR(10) NOT NULL,
  "field" VARCHAR(100) NOT NULL, "value" TEXT NOT NULL, "verified_at" TIMESTAMP(3), CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "translations_entity_type_entity_id_locale_field_key" ON "translations"("entity_type", "entity_id", "locale", "field");
CREATE TABLE "content_audit_entries" (
  "id" UUID NOT NULL, "actor_id" UUID, "action" VARCHAR(100) NOT NULL, "resource_type" VARCHAR(50) NOT NULL,
  "resource_id" UUID NOT NULL, "metadata" JSONB NOT NULL DEFAULT '{}', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_audit_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "content_audit_entries_resource_type_resource_id_idx" ON "content_audit_entries"("resource_type", "resource_id");

ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_published_revision_id_fkey" FOREIGN KEY ("published_revision_id") REFERENCES "content_revisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "content_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pronunciation_variants" ADD CONSTRAINT "pronunciation_variants_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabulary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pronunciation_variants" ADD CONSTRAINT "pronunciation_variants_audio_asset_id_fkey" FOREIGN KEY ("audio_asset_id") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lesson_vocabulary" ADD CONSTRAINT "lesson_vocabulary_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "content_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_vocabulary" ADD CONSTRAINT "lesson_vocabulary_vocabulary_id_fkey" FOREIGN KEY ("vocabulary_id") REFERENCES "vocabulary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_grammar" ADD CONSTRAINT "lesson_grammar_revision_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "content_revisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_grammar" ADD CONSTRAINT "lesson_grammar_grammar_id_fkey" FOREIGN KEY ("grammar_id") REFERENCES "grammar_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "content_audit_entries" ADD CONSTRAINT "content_audit_entries_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
