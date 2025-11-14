/*
  Warnings:

  - The `type` column on the `Users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Session_invitations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `game_mode` on the `Fields` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `team_label` on the `Session_teams` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `game_mode` on the `Sessions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Conversations` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Friends` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_preferences";

-- CreateEnum
CREATE TYPE "auth"."UserType" AS ENUM ('USER', 'ADMIN', 'PARTNER');

-- CreateEnum
CREATE TYPE "shared"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "sessions"."TeamLabel" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "social"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "social"."ConversationType" AS ENUM ('PRIVATE', 'GROUP', 'EVENT');

-- CreateEnum
CREATE TYPE "sessions"."GameModes" AS ENUM ('TWO_V_TWO', 'THREE_V_THREE', 'FOUR_V_FOUR', 'FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'EIGHT_V_EIGHT', 'TEN_V_TEN', 'ELEVEN_V_ELEVEN');

-- CreateEnum
CREATE TYPE "user_preferences"."User_hour_preference_type" AS ENUM ('RECURRENT', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "user_preferences"."Time_period" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- AlterTable
ALTER TABLE "auth"."Users" DROP COLUMN "type",
ADD COLUMN     "type" "auth"."UserType" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "infrastructure"."Fields" DROP COLUMN "game_mode",
ADD COLUMN     "game_mode" "sessions"."GameModes" NOT NULL;

-- AlterTable
ALTER TABLE "sessions"."Session_invitations" DROP COLUMN "status",
ADD COLUMN     "status" "shared"."InvitationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "sessions"."Session_teams" DROP COLUMN "team_label",
ADD COLUMN     "team_label" "sessions"."TeamLabel" NOT NULL;

-- AlterTable
ALTER TABLE "sessions"."Sessions" DROP COLUMN "game_mode",
ADD COLUMN     "game_mode" "sessions"."GameModes" NOT NULL;

-- AlterTable
ALTER TABLE "social"."Conversations" DROP COLUMN "type",
ADD COLUMN     "type" "social"."ConversationType" NOT NULL;

-- AlterTable
ALTER TABLE "social"."Friends" DROP COLUMN "status",
ADD COLUMN     "status" "shared"."InvitationStatus" NOT NULL;

-- AlterTable
ALTER TABLE "social"."Messages" DROP COLUMN "status",
ADD COLUMN     "status" "social"."MessageStatus" NOT NULL DEFAULT 'SENT';

-- DropEnum
DROP TYPE "auth"."User_type";

-- DropEnum
DROP TYPE "sessions"."Game_modes";

-- DropEnum
DROP TYPE "sessions"."Team_label";

-- DropEnum
DROP TYPE "shared"."Invitation_status";

-- DropEnum
DROP TYPE "social"."Conversation_type";

-- DropEnum
DROP TYPE "social"."Message_status";

-- CreateTable
CREATE TABLE "user_preferences"."User_sports" (
    "user_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_sports_pkey" PRIMARY KEY ("user_uid","sport")
);

-- CreateTable
CREATE TABLE "user_preferences"."User_hour_preferences" (
    "uid" TEXT NOT NULL,
    "type" "user_preferences"."User_hour_preference_type" NOT NULL,
    "user_uid" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time_period" "user_preferences"."Time_period" NOT NULL,
    "date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_hour_preferences_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE INDEX "User_sports_user_uid_idx" ON "user_preferences"."User_sports"("user_uid");

-- CreateIndex
CREATE INDEX "User_sports_sport_idx" ON "user_preferences"."User_sports"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "User_sports_user_uid_sport_key" ON "user_preferences"."User_sports"("user_uid", "sport");

-- CreateIndex
CREATE INDEX "User_hour_preferences_user_uid_idx" ON "user_preferences"."User_hour_preferences"("user_uid");

-- CreateIndex
CREATE INDEX "User_hour_preferences_time_period_idx" ON "user_preferences"."User_hour_preferences"("time_period");

-- CreateIndex
CREATE INDEX "User_hour_preferences_day_of_week_idx" ON "user_preferences"."User_hour_preferences"("day_of_week");

-- CreateIndex
CREATE INDEX "Email_verification_user_uid_idx" ON "auth"."Email_verification"("user_uid");

-- CreateIndex
CREATE INDEX "Refresh_tokens_user_uid_idx" ON "auth"."Refresh_tokens"("user_uid");

-- CreateIndex
CREATE INDEX "User_tokens_user_uid_idx" ON "auth"."User_tokens"("user_uid");

-- CreateIndex
CREATE INDEX "Users_created_at_idx" ON "auth"."Users"("created_at");

-- CreateIndex
CREATE INDEX "Users_is_connected_idx" ON "auth"."Users"("is_connected");

-- CreateIndex
CREATE INDEX "Field_images_field_uid_idx" ON "infrastructure"."Field_images"("field_uid");

-- CreateIndex
CREATE INDEX "Fields_partner_uid_idx" ON "infrastructure"."Fields"("partner_uid");

-- CreateIndex
CREATE INDEX "Fields_longitude_latitude_idx" ON "infrastructure"."Fields"("longitude", "latitude");

-- CreateIndex
CREATE INDEX "Fields_sport_idx" ON "infrastructure"."Fields"("sport");

-- CreateIndex
CREATE INDEX "Partner_opening_hours_partner_uid_idx" ON "infrastructure"."Partner_opening_hours"("partner_uid");

-- CreateIndex
CREATE INDEX "Partner_sports_partner_uid_idx" ON "infrastructure"."Partner_sports"("partner_uid");

-- CreateIndex
CREATE INDEX "Partner_sports_sport_idx" ON "infrastructure"."Partner_sports"("sport");

-- CreateIndex
CREATE INDEX "User_ratings_evaluated_uid_idx" ON "ratings"."User_ratings"("evaluated_uid");

-- CreateIndex
CREATE INDEX "Session_invitations_session_uid_idx" ON "sessions"."Session_invitations"("session_uid");

-- CreateIndex
CREATE INDEX "Session_invitations_receiver_uid_idx" ON "sessions"."Session_invitations"("receiver_uid");

-- CreateIndex
CREATE INDEX "Session_players_session_uid_idx" ON "sessions"."Session_players"("session_uid");

-- CreateIndex
CREATE INDEX "Session_players_userUid_idx" ON "sessions"."Session_players"("userUid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_teams_session_uid_team_label_key" ON "sessions"."Session_teams"("session_uid", "team_label");

-- CreateIndex
CREATE INDEX "Sessions_field_uid_idx" ON "sessions"."Sessions"("field_uid");

-- CreateIndex
CREATE INDEX "Sessions_start_date_end_date_idx" ON "sessions"."Sessions"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "Sessions_sport_idx" ON "sessions"."Sessions"("sport");

-- CreateIndex
CREATE INDEX "Sessions_created_at_idx" ON "sessions"."Sessions"("created_at");

-- CreateIndex
CREATE INDEX "Conversation_members_userUid_idx" ON "social"."Conversation_members"("userUid");

-- CreateIndex
CREATE INDEX "Conversation_options_conversationUid_idx" ON "social"."Conversation_options"("conversationUid");

-- CreateIndex
CREATE INDEX "Conversation_options_userUid_idx" ON "social"."Conversation_options"("userUid");

-- CreateIndex
CREATE INDEX "Messages_conversation_uid_idx" ON "social"."Messages"("conversation_uid");

-- CreateIndex
CREATE INDEX "Messages_created_at_idx" ON "social"."Messages"("created_at");

-- AddForeignKey
ALTER TABLE "user_preferences"."User_sports" ADD CONSTRAINT "User_sports_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_sports" ADD CONSTRAINT "User_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_hour_preferences" ADD CONSTRAINT "User_hour_preferences_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
