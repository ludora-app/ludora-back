/*
  Warnings:

  - You are about to drop the column `deviceUid` on the `Refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `deviceUid` on the `User_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `stripe_account_uid` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_account_id]` on the table `Users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "auth"."Users_stripe_account_uid_key";

-- AlterTable
ALTER TABLE "auth"."Refresh_tokens" DROP COLUMN "deviceUid",
ADD COLUMN     "device_uid" TEXT,
ADD COLUMN     "organisation_uid" TEXT;

-- AlterTable
ALTER TABLE "auth"."User_tokens" DROP COLUMN "deviceUid",
ADD COLUMN     "device_uid" TEXT,
ADD COLUMN     "organisation_uid" TEXT;

-- AlterTable
ALTER TABLE "auth"."Users" DROP COLUMN "stripe_account_uid",
ADD COLUMN     "stripe_account_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Users_stripe_account_id_key" ON "auth"."Users"("stripe_account_id");

-- AddForeignKey
ALTER TABLE "auth"."User_tokens" ADD CONSTRAINT "User_tokens_organisation_uid_fkey" FOREIGN KEY ("organisation_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Refresh_tokens" ADD CONSTRAINT "Refresh_tokens_organisation_uid_fkey" FOREIGN KEY ("organisation_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
