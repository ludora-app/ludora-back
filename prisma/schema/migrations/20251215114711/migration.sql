/*
  Warnings:

  - You are about to drop the column `updated_at` on the `User_sports` table. All the data in the column will be lost.
  - Added the required column `short_address` to the `Fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_uid` to the `Sessions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "infrastructure"."Fields" ADD COLUMN     "short_address" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sessions"."Sessions" ADD COLUMN     "creator_uid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_preferences"."User_sports" DROP COLUMN "updated_at";

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_creator_uid_fkey" FOREIGN KEY ("creator_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
