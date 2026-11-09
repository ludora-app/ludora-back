BEGIN;

ALTER TABLE "infrastructure"."Sports" ADD COLUMN IF NOT EXISTS "activated_at" TIMESTAMP(3);
ALTER TABLE "infrastructure"."Sports" ADD COLUMN IF NOT EXISTS "game_modes" "sessions"."game_modes"[];

-- Make sure the 7 sports of the Sport enum exist (fresh databases are seeded after the migrations)
INSERT INTO "infrastructure"."Sports" ("uid", "name", "created_at", "updated_at")
SELECT 'c' || substr(md5(random()::text || sport_name), 1, 24), sport_name, now(), now()
FROM unnest(ARRAY['BASKETBALL', 'FOOTBALL', 'TENNIS', 'VOLLEYBALL', 'PADEL', 'BADMINTON', 'PING-PONG']) AS sport_name
ON CONFLICT ("name") DO NOTHING;

-- Open the 4 sports already offered by the mobile app, with their current game modes
UPDATE "infrastructure"."Sports" SET
  "activated_at" = now(),
  "game_modes" = ARRAY['ONE_V_ONE', 'THREE_V_THREE', 'FIVE_V_FIVE']::"sessions"."game_modes"[],
  "updated_at" = now()
WHERE "name" = 'BASKETBALL';

UPDATE "infrastructure"."Sports" SET
  "activated_at" = now(),
  "game_modes" = ARRAY['ONE_V_ONE', 'TWO_V_TWO', 'FIVE_V_FIVE', 'SEVEN_V_SEVEN', 'ELEVEN_V_ELEVEN']::"sessions"."game_modes"[],
  "updated_at" = now()
WHERE "name" = 'FOOTBALL';

UPDATE "infrastructure"."Sports" SET
  "activated_at" = now(),
  "game_modes" = ARRAY['ONE_V_ONE', 'TWO_V_TWO']::"sessions"."game_modes"[],
  "updated_at" = now()
WHERE "name" IN ('TENNIS', 'PADEL');

COMMIT;
