-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "moderation";

-- CreateEnum
CREATE TYPE "moderation"."report_reason" AS ENUM ('SPAM', 'HARASSMENT', 'NUDITY', 'OTHER');

-- DropIndex
DROP INDEX "auth"."idx_users_firstname_trgm";

-- DropIndex
DROP INDEX "auth"."idx_users_lastname_trgm";

-- DropIndex
DROP INDEX "infrastructure"."idx_fields_name_trgm";

-- DropIndex
DROP INDEX "sessions"."idx_sessions_title_trgm";

-- CreateTable
CREATE TABLE "moderation"."User_blocks" (
    "blocker_uid" TEXT NOT NULL,
    "blocked_uid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_blocks_pkey" PRIMARY KEY ("blocker_uid","blocked_uid")
);

-- CreateTable
CREATE TABLE "moderation"."User_reports" (
    "id" TEXT NOT NULL,
    "reporter_uid" TEXT NOT NULL,
    "reported_uid" TEXT NOT NULL,
    "reason" "moderation"."report_reason" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "moderation"."User_blocks" ADD CONSTRAINT "User_blocks_blocker_uid_fkey" FOREIGN KEY ("blocker_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation"."User_blocks" ADD CONSTRAINT "User_blocks_blocked_uid_fkey" FOREIGN KEY ("blocked_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation"."User_reports" ADD CONSTRAINT "User_reports_reporter_uid_fkey" FOREIGN KEY ("reporter_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation"."User_reports" ADD CONSTRAINT "User_reports_reported_uid_fkey" FOREIGN KEY ("reported_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
