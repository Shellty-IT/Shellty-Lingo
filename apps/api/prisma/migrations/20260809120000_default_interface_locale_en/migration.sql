-- English is now the default interface language for new accounts (Polish
-- was the historical default). Existing rows keep whatever value they
-- already have; this only changes the default applied to new inserts.
ALTER TABLE "user_profiles" ALTER COLUMN "interface_locale" SET DEFAULT 'en';
