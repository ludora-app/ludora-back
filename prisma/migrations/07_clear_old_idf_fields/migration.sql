-- Migration: Remplacement des terrains et nettoyage des sessions
-- Description: Rend field_uid nullable, purge, insère les nouveaux et restaure l'intégrité.

BEGIN; -- Début de la transaction de sécurité

-- 1.  TEMPORARY CONSTRAINT DELETION & NULL ALLOWED
ALTER TABLE "sessions"."Sessions" ALTER COLUMN "field_uid" DROP NOT NULL;


-- 2. TRUNCATE TABLES
TRUNCATE TABLE "infrastructure"."Field_sports" CASCADE;
TRUNCATE TABLE "infrastructure"."Field_images" CASCADE;
TRUNCATE TABLE "infrastructure"."Field_slots" CASCADE;

-- 3. OLD FIELDS PURGE
DELETE FROM "infrastructure"."Fields";

-- 4. NEW FIELDS INSERTION
-- INSERT INTO "infrastructure"."Fields" (uid, name, ...) VALUES (...);

-- 5. ORPHAN SESSIONS PURGE
DELETE FROM "sessions"."Sessions" WHERE "field_uid" IS NULL;

-- 6. SAFETY CHECK
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "sessions"."Sessions" WHERE "field_uid" IS NULL) THEN
        RAISE EXCEPTION 'ERREUR CRITIQUE : Des sessions sont encore orphelines. Rollback immédiat.';
    END IF;
END $$;

-- 7. RESTORE CONSTRAINT
ALTER TABLE "sessions"."Sessions" ALTER COLUMN "field_uid" SET NOT NULL;

COMMIT;