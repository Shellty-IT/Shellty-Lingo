-- Older vocabulary cards stored a Polish word as the English definition.
-- Update only unchanged seed values, preserving editorial revisions.
UPDATE "vocabulary_entries" AS v
SET "definition" = meanings.english
FROM (
  VALUES
    ('deadline', 'termin', 'the latest time by which something must be finished'),
    ('invoice', 'faktura', 'a document requesting payment for goods or services'),
    ('receipt', 'paragon', 'a document confirming that payment was received'),
    ('safe', 'bezpieczny', 'not likely to cause harm or danger')
) AS meanings(term, old_value, english)
WHERE v."language" = 'en'
  AND v."term" = meanings.term
  AND v."definition" = meanings.old_value;

UPDATE "translations" AS t
SET "value" = meanings.english
FROM "vocabulary_entries" AS v
JOIN (
  VALUES
    ('deadline', 'the latest time by which something must be finished'),
    ('invoice', 'a document requesting payment for goods or services'),
    ('receipt', 'a document confirming that payment was received'),
    ('safe', 'not likely to cause harm or danger')
) AS meanings(term, english) ON meanings.term = v."term"
WHERE t."entity_type" = 'vocabulary_entry'
  AND t."entity_id" = v."id"
  AND t."locale" = 'en'
  AND t."field" = 'definition'
  AND t."value" = v."term"
  AND v."language" = 'en';
