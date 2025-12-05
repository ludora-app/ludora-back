/*
  Warnings:

  - The values [EVENT] on the enum `ConversationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `event_uid` on the `Conversations` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "social"."ConversationType_new" AS ENUM ('PRIVATE', 'GROUP', 'SESSION');
ALTER TABLE "social"."Conversations" ALTER COLUMN "type" TYPE "social"."ConversationType_new" USING ("type"::text::"social"."ConversationType_new");
ALTER TYPE "social"."ConversationType" RENAME TO "ConversationType_old";
ALTER TYPE "social"."ConversationType_new" RENAME TO "ConversationType";
DROP TYPE "social"."ConversationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "social"."Conversations" DROP COLUMN "event_uid",
ADD COLUMN     "session_uid" TEXT;
