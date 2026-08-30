-- Localize the Thai-script path for every supported interface locale.
INSERT INTO "translations" ("id", "entity_type", "entity_id", "locale", "field", "value", "verified_at")
SELECT md5(unit."id"::text || ':' || localized."locale" || ':' || localized."field")::uuid,
       'thai_script_unit', unit."id", localized."locale", localized."field", localized."value", NOW()
FROM "thai_script_units" AS unit
CROSS JOIN LATERAL (
  VALUES
    ('pl', 'name', unit."name"),
    ('pl', 'meaning', unit."meaning"),
    ('pl', 'exampleTranslation', unit."example"->>'translation')
) AS localized("locale", "field", "value")
ON CONFLICT ("entity_type", "entity_id", "locale", "field") DO UPDATE
SET "value" = EXCLUDED."value", "verified_at" = EXCLUDED."verified_at";

INSERT INTO "translations" ("id", "entity_type", "entity_id", "locale", "field", "value", "verified_at")
SELECT md5(unit."id"::text || ':' || localized."locale" || ':' || localized."field")::uuid,
       'thai_script_unit', unit."id", localized."locale", localized."field", localized."value", NOW()
FROM "thai_script_units" AS unit
JOIN (VALUES
  ('ก', 'en', 'name', 'ก ไก่ — ko kai'),
  ('ก', 'en', 'meaning', 'mid-class consonant'),
  ('ก', 'en', 'exampleTranslation', 'chicken'),
  ('ก', 'th', 'name', 'ก ไก่ — กอ ไก่'),
  ('ก', 'th', 'meaning', 'พยัญชนะอักษรกลาง'),
  ('ก', 'th', 'exampleTranslation', 'ไก่'),
  ('ข', 'en', 'name', 'ข ไข่ — kho khai'),
  ('ข', 'en', 'meaning', 'high-class consonant'),
  ('ข', 'en', 'exampleTranslation', 'egg'),
  ('ข', 'th', 'name', 'ข ไข่ — ขอ ไข่'),
  ('ข', 'th', 'meaning', 'พยัญชนะอักษรสูง'),
  ('ข', 'th', 'exampleTranslation', 'ไข่'),
  ('า', 'en', 'name', 'sara aa'),
  ('า', 'en', 'meaning', 'long /aː/ vowel'),
  ('า', 'en', 'exampleTranslation', 'to come'),
  ('า', 'th', 'name', 'สระอา'),
  ('า', 'th', 'meaning', 'สระเสียงยาว /อา/'),
  ('า', 'th', 'exampleTranslation', 'มา'),
  ('กา', 'en', 'name', 'kaa'),
  ('กา', 'en', 'meaning', 'crow or kettle, depending on context'),
  ('กา', 'en', 'exampleTranslation', 'crow'),
  ('กา', 'th', 'name', 'กา'),
  ('กา', 'th', 'meaning', 'อีกาหรือกาต้มน้ำ ขึ้นอยู่กับบริบท'),
  ('กา', 'th', 'exampleTranslation', 'อีกา'),
  ('๑', 'en', 'name', 'nueng'),
  ('๑', 'en', 'meaning', 'one'),
  ('๑', 'en', 'exampleTranslation', 'one'),
  ('๑', 'th', 'name', 'หนึ่ง'),
  ('๑', 'th', 'meaning', 'เลขหนึ่ง'),
  ('๑', 'th', 'exampleTranslation', 'หนึ่ง'),
  ('ก่า', 'en', 'name', 'mai ek with a mid-class consonant'),
  ('ก่า', 'en', 'meaning', 'The ่ tone mark usually produces a low tone in a live syllable beginning with a mid-class consonant.'),
  ('ก่า', 'en', 'exampleTranslation', 'tone-rule example'),
  ('ก่า', 'th', 'name', 'ไม้เอกกับอักษรกลาง'),
  ('ก่า', 'th', 'meaning', 'ไม้เอกมักทำให้พยางค์เป็นเสียงเอก เมื่อพยางค์เป็นคำเป็นและขึ้นต้นด้วยอักษรกลาง'),
  ('ก่า', 'th', 'exampleTranslation', 'ตัวอย่างกฎวรรณยุกต์')
) AS localized("glyph", "locale", "field", "value") ON localized."glyph" = unit."glyph"
ON CONFLICT ("entity_type", "entity_id", "locale", "field") DO UPDATE
SET "value" = EXCLUDED."value", "verified_at" = EXCLUDED."verified_at";
