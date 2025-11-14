/*
  Warnings:

  - The primary key for the `User_sports` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `uid` was added to the `User_sports` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "user_preferences"."User_sports" DROP CONSTRAINT "User_sports_pkey",
ADD COLUMN     "uid" TEXT NOT NULL,
ADD CONSTRAINT "User_sports_pkey" PRIMARY KEY ("uid");
