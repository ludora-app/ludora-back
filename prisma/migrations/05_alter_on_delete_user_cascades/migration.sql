/*
  Warnings:

  - The primary key for the `User_ratings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `User_ratings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `uid` was added to the `Session_players` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "ratings"."User_ratings" DROP CONSTRAINT IF EXISTS "User_ratings_evaluator_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_invitations" DROP CONSTRAINT IF EXISTS "Session_invitations_receiver_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_invitations" DROP CONSTRAINT IF EXISTS "Session_invitations_sender_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_players" DROP CONSTRAINT IF EXISTS "Session_players_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Sessions" DROP CONSTRAINT IF EXISTS "Sessions_creator_uid_fkey";

-- DropForeignKey
ALTER TABLE "social"."Conversation_members" DROP CONSTRAINT IF EXISTS "Conversation_members_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "social"."Messages" DROP CONSTRAINT IF EXISTS "Messages_sender_uid_fkey";


-- AlterTable Users
ALTER TABLE "auth"."Users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "is_anonymized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable User_ratings: add id as nullable, backfill, then set NOT NULL and change PK (safe for existing data)
ALTER TABLE "ratings"."User_ratings" ADD COLUMN IF NOT EXISTS "id" TEXT;
UPDATE "ratings"."User_ratings" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;
ALTER TABLE "ratings"."User_ratings" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "ratings"."User_ratings" DROP CONSTRAINT IF EXISTS "User_ratings_pkey";
ALTER TABLE "ratings"."User_ratings" ALTER COLUMN "evaluator_uid" DROP NOT NULL;
ALTER TABLE "ratings"."User_ratings" ALTER COLUMN "evaluated_uid" DROP NOT NULL;
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_pkey" PRIMARY KEY ("id");

-- AlterTable Session_players: add uid as nullable, backfill, then set NOT NULL and change PK (safe for existing data)
ALTER TABLE "sessions"."Session_players" ADD COLUMN IF NOT EXISTS "uid" TEXT;
UPDATE "sessions"."Session_players" SET "uid" = gen_random_uuid()::text WHERE "uid" IS NULL;
ALTER TABLE "sessions"."Session_players" ALTER COLUMN "uid" SET NOT NULL;
ALTER TABLE "sessions"."Session_players" DROP CONSTRAINT IF EXISTS "Session_players_pkey";
ALTER TABLE "sessions"."Session_players" ALTER COLUMN "user_uid" DROP NOT NULL;
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_pkey" PRIMARY KEY ("uid");

-- AlterTable
ALTER TABLE "sessions"."Sessions" ALTER COLUMN "creator_uid" DROP NOT NULL;

-- AlterTable
ALTER TABLE "social"."Messages" ALTER COLUMN "sender_uid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_evaluator_uid_fkey" FOREIGN KEY ("evaluator_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_creator_uid_fkey" FOREIGN KEY ("creator_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_receiver_uid_fkey" FOREIGN KEY ("receiver_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Messages" ADD CONSTRAINT "Messages_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_members" ADD CONSTRAINT "Conversation_members_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
