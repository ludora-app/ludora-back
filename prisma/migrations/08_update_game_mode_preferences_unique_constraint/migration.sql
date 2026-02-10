/*
  Warnings:

  - You are about to drop the column `sportsUid` on the `Fields` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_uid,gameMode,sport]` on the table `User_game_mode_preferences` will be added. If there are existing duplicate values, this will fail.


*/
-- DropForeignKey
ALTER TABLE "infrastructure"."Fields" DROP CONSTRAINT "Fields_sportsUid_fkey";

-- DropIndex
DROP INDEX "user_preferences"."User_game_mode_preferences_user_uid_gameMode_key";

-- AlterTable
ALTER TABLE "infrastructure"."Fields" DROP COLUMN "sportsUid";

-- CreateIndex
CREATE UNIQUE INDEX "User_game_mode_preferences_user_uid_gameMode_sport_key" ON "user_preferences"."User_game_mode_preferences"("user_uid", "gameMode", "sport");

