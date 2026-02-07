/*
  Warnings:

  - You are about to drop the column `sport` on the `Fields` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "infrastructure"."Fields" DROP CONSTRAINT "Fields_sport_fkey";

-- DropIndex
DROP INDEX "infrastructure"."Fields_sport_idx";

-- AlterTable
ALTER TABLE "infrastructure"."Fields" DROP COLUMN "sport",
ADD COLUMN     "sportsUid" TEXT;

-- CreateTable
CREATE TABLE "infrastructure"."Field_sports" (
    "field_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "Field_sports_field_uid_idx" ON "infrastructure"."Field_sports"("field_uid");

-- CreateIndex
CREATE INDEX "Field_sports_sport_idx" ON "infrastructure"."Field_sports"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "Field_sports_field_uid_sport_key" ON "infrastructure"."Field_sports"("field_uid", "sport");

-- AddForeignKey
ALTER TABLE "infrastructure"."Fields" ADD CONSTRAINT "Fields_sportsUid_fkey" FOREIGN KEY ("sportsUid") REFERENCES "infrastructure"."Sports"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_sports" ADD CONSTRAINT "Field_sports_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_sports" ADD CONSTRAINT "Field_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
