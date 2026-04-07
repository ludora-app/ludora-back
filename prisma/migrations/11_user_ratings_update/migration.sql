BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE "ratings"."User_global_ratings"
  DROP CONSTRAINT IF EXISTS "User_global_ratings_sport_name_fkey";

DROP INDEX IF EXISTS "ratings"."User_global_ratings_user_uid_sport_name_key";
DROP INDEX IF EXISTS "ratings"."User_ratings_evaluator_uid_evaluated_uid_key";

ALTER TABLE "ratings"."User_global_ratings"
  DROP COLUMN IF EXISTS "sport_name",
  ADD COLUMN IF NOT EXISTS "sport" TEXT NOT NULL;

ALTER TABLE "ratings"."User_ratings"
  DROP COLUMN IF EXISTS "note_4",
  DROP COLUMN IF EXISTS "note_5",
  ADD COLUMN IF NOT EXISTS "session_uid" TEXT,
  ADD COLUMN IF NOT EXISTS "sport" TEXT NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_global_ratings_user_uid_sport_key"
  ON "ratings"."User_global_ratings"("user_uid", "sport");

CREATE UNIQUE INDEX IF NOT EXISTS "User_ratings_evaluator_uid_evaluated_uid_session_uid_key"
  ON "ratings"."User_ratings"("evaluator_uid", "evaluated_uid", "session_uid");

ALTER TABLE "ratings"."User_ratings"
  DROP CONSTRAINT IF EXISTS "User_ratings_session_uid_fkey",
  ADD CONSTRAINT "User_ratings_session_uid_fkey"
  FOREIGN KEY ("session_uid")
  REFERENCES "sessions"."Sessions"("uid")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ratings"."User_ratings"
  DROP CONSTRAINT IF EXISTS "User_ratings_sport_fkey",
  ADD CONSTRAINT "User_ratings_sport_fkey"
  FOREIGN KEY ("sport")
  REFERENCES "infrastructure"."Sports"("name")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ratings"."User_global_ratings"
  DROP CONSTRAINT IF EXISTS "User_global_ratings_sport_fkey",
  ADD CONSTRAINT "User_global_ratings_sport_fkey"
  FOREIGN KEY ("sport")
  REFERENCES "infrastructure"."Sports"("name")
  ON DELETE NO ACTION ON UPDATE CASCADE;

UPDATE "infrastructure"."Sports"
SET "name" = 'PADEL'
WHERE "name" = 'PADDEL'
AND NOT EXISTS (
    SELECT 1 FROM "infrastructure"."Sports" WHERE "name" = 'PADEL'
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rating_status' AND typnamespace = 'sessions'::regnamespace) THEN
        CREATE TYPE "sessions"."rating_status" AS ENUM ('PENDING', 'VALIDATED', 'REFUSED');
    END IF;
END $$;

ALTER TABLE "sessions"."Session_players"
  ADD COLUMN IF NOT EXISTS "rating_status" "sessions"."rating_status";

COMMIT;