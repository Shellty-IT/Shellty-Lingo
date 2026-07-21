-- Review items created from a failed exercise without an explanation used to
-- store a hardcoded Polish fallback ("Spróbuj ponownie."). The column becomes
-- nullable so clients can render a localized fallback instead; existing rows
-- holding the old hardcoded text are cleared to the new representation.
ALTER TABLE "review_items" ALTER COLUMN "translation" DROP NOT NULL;

UPDATE "review_items"
SET "translation" = NULL
WHERE "translation" = 'Spróbuj ponownie.';
