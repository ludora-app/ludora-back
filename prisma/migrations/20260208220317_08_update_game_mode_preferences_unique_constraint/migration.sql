/*
  Warnings:

  - You are about to drop the column `sportsUid` on the `Fields` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "infrastructure"."Fields" DROP CONSTRAINT "Fields_sportsUid_fkey";

-- DropIndex
DROP INDEX "user_preferences"."User_game_mode_preferences_user_uid_gameMode_key";

-- AlterTable
ALTER TABLE "infrastructure"."Fields" DROP COLUMN "sportsUid";
