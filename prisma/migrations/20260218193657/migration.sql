-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notifications"."notification_type" ADD VALUE 'MESSAGE_SENT';
ALTER TYPE "notifications"."notification_type" ADD VALUE 'MESSAGES_READ';
ALTER TYPE "notifications"."notification_type" ADD VALUE 'SESSION_PLAYER_ADDED';

-- AlterTable
ALTER TABLE "social"."Conversation_members" ALTER COLUMN "display_messages_after" DROP NOT NULL,
ALTER COLUMN "display_messages_after" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "User_game_mode_preferences_user_uid_sport_idx" ON "user_preferences"."User_game_mode_preferences"("user_uid", "sport");

-- AddForeignKey
ALTER TABLE "user_preferences"."User_game_mode_preferences" ADD CONSTRAINT "User_game_mode_preferences_user_uid_sport_fkey" FOREIGN KEY ("user_uid", "sport") REFERENCES "user_preferences"."User_sports"("user_uid", "sport") ON DELETE CASCADE ON UPDATE CASCADE;
