BEGIN;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='Users' AND column_name='is_banned') THEN
        ALTER TABLE "auth"."Users" ADD COLUMN "is_banned" BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='auth' AND table_name='Users' AND column_name='ban_reason') THEN
        ALTER TABLE "auth"."Users" ADD COLUMN "ban_reason" "moderation"."report_reason";
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "moderation"."Report_images" (
    "uid" TEXT NOT NULL,
    "report_uid" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_images_pkey" PRIMARY KEY ("uid")
);

CREATE INDEX IF NOT EXISTS "Report_images_report_uid_idx" ON "moderation"."Report_images"("report_uid");

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Report_images_report_uid_fkey') THEN
        ALTER TABLE "moderation"."Report_images" 
        ADD CONSTRAINT "Report_images_report_uid_fkey" 
        FOREIGN KEY ("report_uid") REFERENCES "moderation"."User_reports"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

COMMIT;