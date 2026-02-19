/*
  Warnings:

  - You are about to drop the column `userUid` on the `Session_players` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[session_uid,user_uid]` on the table `Session_players` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_uid` to the `Session_players` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sessions"."Session_players" DROP CONSTRAINT "Session_players_userUid_fkey";

-- DropIndex
DROP INDEX "sessions"."Session_players_session_uid_userUid_key";

-- DropIndex
DROP INDEX "sessions"."Session_players_userUid_idx";

-- AlterTable
ALTER TABLE "sessions"."Session_players" DROP COLUMN "userUid",
ADD COLUMN     "user_uid" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Session_players_user_uid_idx" ON "sessions"."Session_players"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_players_session_uid_user_uid_key" ON "sessions"."Session_players"("session_uid", "user_uid");

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
