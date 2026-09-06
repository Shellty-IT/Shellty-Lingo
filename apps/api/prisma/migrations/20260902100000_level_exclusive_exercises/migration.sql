CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "LearningLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');

-- Split the only multi-level technical tracks before the level column becomes
-- an enum. Modules (and therefore lessons) move; exercises are never copied.
INSERT INTO "courses" (
  "id", "slug", "language", "level", "category", "title", "description",
  "status", "created_at", "updated_at"
)
SELECT
  gen_random_uuid(), target.slug, source."language", target.level,
  source."category", target.title, source."description", source."status",
  source."created_at", source."updated_at"
FROM "courses" source
CROSS JOIN (VALUES
  ('english-for-it-a2', 'A2', 'English for IT · A2'),
  ('english-for-it-b1', 'B1', 'English for IT · B1'),
  ('english-for-it-b2', 'B2', 'English for IT · B2')
) AS target(slug, level, title)
WHERE source."slug" = 'english-for-it';

UPDATE "course_modules" module
SET "course_id" = target."id", "position" = 1
FROM "courses" source, "courses" target
WHERE source."slug" = 'english-for-it'
  AND target."slug" = 'english-for-it-' || substring(module."slug" from 4)
  AND module."course_id" = source."id"
  AND module."slug" <> 'it-a1';

UPDATE "courses"
SET "slug" = 'english-for-it-a1', "level" = 'A1', "title" = 'English for IT · A1'
WHERE "slug" = 'english-for-it';

INSERT INTO "courses" (
  "id", "slug", "language", "level", "category", "title", "description",
  "status", "created_at", "updated_at"
)
SELECT
  gen_random_uuid(), target.slug, source."language", target.level,
  source."category", target.title, source."description", source."status",
  source."created_at", source."updated_at"
FROM "courses" source
CROSS JOIN (VALUES
  ('thai-for-it-a2', 'A2', 'Thai for IT · A2'),
  ('thai-for-it-b1', 'B1', 'Thai for IT · B1')
) AS target(slug, level, title)
WHERE source."slug" = 'thai-for-it';

UPDATE "course_modules" module
SET "course_id" = target."id", "position" = 1
FROM "courses" source, "courses" target
WHERE source."slug" = 'thai-for-it'
  AND target."slug" = 'thai-for-it-' || substring(module."slug" from 4)
  AND module."course_id" = source."id"
  AND module."slug" <> 'it-a1';

UPDATE "courses"
SET "slug" = 'thai-for-it-a1', "level" = 'A1', "title" = 'Thai for IT · A1'
WHERE "slug" = 'thai-for-it';

-- Curated single-level ownership for the remaining legacy range-labelled tracks.
UPDATE "courses" SET "level" = 'A1' WHERE "slug" IN ('english-vocabulary', 'thai-vocabulary');
UPDATE "courses" SET "level" = 'A2' WHERE "slug" IN ('english-phrases', 'thai-phrases');
UPDATE "courses" SET "level" = 'B1' WHERE "slug" IN ('english-business', 'thai-business');

ALTER TABLE "courses"
  ALTER COLUMN "level" TYPE "LearningLevel"
  USING ("level"::"LearningLevel");

ALTER TABLE "user_courses"
  ALTER COLUMN "current_level" DROP DEFAULT,
  ALTER COLUMN "current_level" TYPE "LearningLevel"
    USING ("current_level"::"LearningLevel"),
  ALTER COLUMN "current_level" SET DEFAULT 'A1';

ALTER TABLE "exercises"
  ADD COLUMN "level" "LearningLevel",
  ADD COLUMN "content_fingerprint" CHAR(64);

UPDATE "exercises" exercise
SET
  "level" = course."level",
  "content_fingerprint" = encode(
    digest(
      lower(course."language") || chr(31) || exercise."type"::text || chr(31) ||
      lower(regexp_replace(trim(exercise."prompt"), '[[:space:]]+', ' ', 'g')) || chr(31) ||
      CASE
        WHEN jsonb_typeof(exercise."options") = 'array' THEN coalesce(
          (
            SELECT jsonb_agg(option.value ORDER BY option.value->>'id')::text
            FROM jsonb_array_elements(exercise."options") option(value)
          ),
          '[]'
        )
        ELSE coalesce(exercise."options"::text, 'null')
      END,
      'sha256'
    ),
    'hex'
  )
FROM "content_revisions" revision
JOIN "lessons" lesson ON lesson."id" = revision."lesson_id"
JOIN "course_modules" module ON module."id" = lesson."module_id"
JOIN "courses" course ON course."id" = module."course_id"
WHERE exercise."revision_id" = revision."id";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "exercises"
    GROUP BY "content_fingerprint"
    HAVING count(DISTINCT "level") > 1
  ) THEN
    RAISE EXCEPTION 'An exercise identity is assigned to more than one learning level';
  END IF;
END $$;

ALTER TABLE "exercises"
  ALTER COLUMN "level" SET NOT NULL,
  ALTER COLUMN "content_fingerprint" SET NOT NULL;

CREATE TABLE "exercise_identities" (
  "fingerprint" CHAR(64) NOT NULL,
  "level" "LearningLevel" NOT NULL,
  CONSTRAINT "exercise_identities_pkey" PRIMARY KEY ("fingerprint", "level")
);

INSERT INTO "exercise_identities" ("fingerprint", "level")
SELECT DISTINCT "content_fingerprint", "level" FROM "exercises";

CREATE UNIQUE INDEX "exercise_identities_fingerprint_key"
  ON "exercise_identities"("fingerprint");
CREATE INDEX "exercise_identities_level_idx"
  ON "exercise_identities"("level");
CREATE INDEX "courses_language_level_status_idx"
  ON "courses"("language", "level", "status");
CREATE INDEX "exercises_level_type_idx"
  ON "exercises"("level", "type");
CREATE INDEX "exercises_content_fingerprint_idx"
  ON "exercises"("content_fingerprint");
CREATE UNIQUE INDEX "exercises_id_level_key"
  ON "exercises"("id", "level");

ALTER TABLE "exercises"
  ADD CONSTRAINT "exercises_content_fingerprint_level_fkey"
  FOREIGN KEY ("content_fingerprint", "level")
  REFERENCES "exercise_identities"("fingerprint", "level")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "review_items"
  ADD COLUMN "exercise_id" UUID,
  ADD COLUMN "level" "LearningLevel";

UPDATE "review_items" review
SET "exercise_id" = exercise."id"
FROM "exercises" exercise
WHERE review."source_key" = 'exercise:' || exercise."id"::text;

UPDATE "review_items" review
SET "level" = coalesce(
  (SELECT exercise."level" FROM "exercises" exercise WHERE exercise."id" = review."exercise_id"),
  course."current_level"
)
FROM "user_courses" course
WHERE course."id" = review."user_course_id";

ALTER TABLE "review_items" ALTER COLUMN "level" SET NOT NULL;

DROP INDEX "review_items_user_course_id_due_at_idx";
CREATE INDEX "review_items_user_course_id_level_due_at_idx"
  ON "review_items"("user_course_id", "level", "due_at");
CREATE INDEX "review_items_exercise_id_idx" ON "review_items"("exercise_id");

ALTER TABLE "review_items"
  ADD CONSTRAINT "review_items_exercise_id_level_fkey"
  FOREIGN KEY ("exercise_id", "level") REFERENCES "exercises"("id", "level")
  ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Defence in depth: direct SQL writes cannot attach an exercise to a course
-- whose exclusive level differs from the exercise's declared level.
CREATE FUNCTION validate_exercise_level() RETURNS trigger AS $$
DECLARE
  parent_level "LearningLevel";
BEGIN
  IF (
    TG_OP = 'UPDATE' AND
    (OLD."type", OLD."prompt", OLD."options") IS DISTINCT FROM
    (NEW."type", NEW."prompt", NEW."options") AND
    OLD."content_fingerprint" = NEW."content_fingerprint"
  ) THEN
    RAISE EXCEPTION 'Exercise content changed without a new content fingerprint';
  END IF;

  SELECT course."level" INTO parent_level
  FROM "content_revisions" revision
  JOIN "lessons" lesson ON lesson."id" = revision."lesson_id"
  JOIN "course_modules" module ON module."id" = lesson."module_id"
  JOIN "courses" course ON course."id" = module."course_id"
  WHERE revision."id" = NEW."revision_id";

  IF parent_level IS NULL OR parent_level <> NEW."level" THEN
    RAISE EXCEPTION 'Exercise level % does not match its course level %', NEW."level", parent_level;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "exercises_validate_level"
  BEFORE INSERT OR UPDATE OF "revision_id", "level", "type", "prompt", "options", "answer", "content_fingerprint" ON "exercises"
  FOR EACH ROW EXECUTE FUNCTION validate_exercise_level();

CREATE FUNCTION prevent_course_level_drift() RETURNS trigger AS $$
BEGIN
  IF (OLD."level", OLD."language") IS DISTINCT FROM (NEW."level", NEW."language")
    AND EXISTS (
      SELECT 1
      FROM "course_modules" module
      JOIN "lessons" lesson ON lesson."module_id" = module."id"
      JOIN "content_revisions" revision ON revision."lesson_id" = lesson."id"
      JOIN "exercises" exercise ON exercise."revision_id" = revision."id"
      WHERE module."course_id" = OLD."id"
    )
  THEN
    RAISE EXCEPTION 'A course with exercises cannot change language or level';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "courses_prevent_level_drift"
  BEFORE UPDATE OF "level", "language" ON "courses"
  FOR EACH ROW EXECUTE FUNCTION prevent_course_level_drift();

CREATE FUNCTION validate_module_level_move() RETURNS trigger AS $$
BEGIN
  IF OLD."course_id" <> NEW."course_id" AND EXISTS (
    SELECT 1
    FROM "lessons" lesson
    JOIN "content_revisions" revision ON revision."lesson_id" = lesson."id"
    JOIN "exercises" exercise ON exercise."revision_id" = revision."id"
    JOIN "courses" target ON target."id" = NEW."course_id"
    WHERE lesson."module_id" = OLD."id" AND exercise."level" <> target."level"
  ) THEN
    RAISE EXCEPTION 'A module cannot move to a course at another level';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "course_modules_validate_level_move"
  BEFORE UPDATE OF "course_id" ON "course_modules"
  FOR EACH ROW EXECUTE FUNCTION validate_module_level_move();
