/*
  Warnings:

  - You are about to drop the column `device_uid` on the `Refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `device_uid` on the `User_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "auth"."Refresh_tokens" DROP COLUMN "device_uid";

-- AlterTable
ALTER TABLE "auth"."User_tokens" DROP COLUMN "device_uid";


