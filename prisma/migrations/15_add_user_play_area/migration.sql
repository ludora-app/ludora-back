BEGIN;

ALTER TABLE "auth"."Users" ADD COLUMN IF NOT EXISTS "play_area_latitude" DOUBLE PRECISION;
ALTER TABLE "auth"."Users" ADD COLUMN IF NOT EXISTS "play_area_longitude" DOUBLE PRECISION;
ALTER TABLE "auth"."Users" ADD COLUMN IF NOT EXISTS "play_area_radius_km" INTEGER;

COMMIT;
