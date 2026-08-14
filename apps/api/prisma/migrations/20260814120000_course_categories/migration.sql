ALTER TABLE "courses"
ADD COLUMN "category" VARCHAR(30) NOT NULL DEFAULT 'general';

DROP INDEX IF EXISTS "courses_language_status_idx";

CREATE INDEX "courses_language_category_status_idx"
ON "courses"("language", "category", "status");
