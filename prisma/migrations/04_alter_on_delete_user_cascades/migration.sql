/*
  Warnings:

  - The primary key for the `User_ratings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `User_ratings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `uid` was added to the `Session_players` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "ratings"."User_ratings" DROP CONSTRAINT "User_ratings_evaluator_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_invitations" DROP CONSTRAINT "Session_invitations_receiver_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_invitations" DROP CONSTRAINT "Session_invitations_sender_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_players" DROP CONSTRAINT "Session_players_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Sessions" DROP CONSTRAINT "Sessions_creator_uid_fkey";

-- DropForeignKey
ALTER TABLE "social"."Conversation_members" DROP CONSTRAINT "Conversation_members_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "social"."Messages" DROP CONSTRAINT "Messages_sender_uid_fkey";


-- AlterTable
ALTER TABLE "auth"."Users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_anonymized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ratings"."User_ratings" DROP CONSTRAINT "User_ratings_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ALTER COLUMN "evaluator_uid" DROP NOT NULL,
ALTER COLUMN "evaluated_uid" DROP NOT NULL,
ADD CONSTRAINT "User_ratings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "sessions"."Session_players" ADD COLUMN     "uid" TEXT NOT NULL,
ALTER COLUMN "user_uid" DROP NOT NULL,
ADD CONSTRAINT "Session_players_pkey" PRIMARY KEY ("uid");

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
