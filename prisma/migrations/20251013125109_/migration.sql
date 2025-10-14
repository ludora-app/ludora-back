-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "infrastructure";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ratings";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sessions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shared";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "social";

-- CreateEnum
CREATE TYPE "auth"."Provider" AS ENUM ('FACEBOOK', 'GOOGLE', 'LUDORA');

-- CreateEnum
CREATE TYPE "auth"."Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "auth"."User_type" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "shared"."Invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "sessions"."Team_label" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "social"."Message_status" AS ENUM ('SENT', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "social"."Message_type" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "social"."Conversation_type" AS ENUM ('PRIVATE', 'GROUP', 'EVENT');

-- CreateEnum
CREATE TYPE "sessions"."Game_modes" AS ENUM ('TWO_V_TWO', 'THREE_V_THREE', 'FOUR_V_FOUR', 'FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'EIGHT_V_EIGHT', 'TEN_V_TEN', 'ELEVEN_V_ELEVEN');

-- CreateTable
CREATE TABLE "auth"."Users" (
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "firstname" TEXT,
    "lastname" TEXT,
    "birthdate" TIMESTAMP(3),
    "sex" "auth"."Sex",
    "phone" TEXT,
    "image_url" TEXT,
    "bio" TEXT,
    "provider" "auth"."Provider" NOT NULL DEFAULT 'LUDORA',
    "is_connected" BOOLEAN NOT NULL DEFAULT true,
    "stripe_account_uid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "type" "auth"."User_type" NOT NULL DEFAULT 'USER',

    CONSTRAINT "Users_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "auth"."Email_verification" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Email_verification_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "auth"."User_tokens" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "deviceUid" TEXT,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_tokens_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "auth"."Refresh_tokens" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "deviceUid" TEXT,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refresh_tokens_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "ratings"."User_ratings" (
    "evaluator_uid" TEXT NOT NULL,
    "evaluated_uid" TEXT NOT NULL,
    "note_1" INTEGER NOT NULL,
    "note_2" INTEGER NOT NULL,
    "note_3" INTEGER NOT NULL,
    "note_4" INTEGER NOT NULL,
    "note_5" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_ratings_pkey" PRIMARY KEY ("evaluator_uid","evaluated_uid")
);

-- CreateTable
CREATE TABLE "ratings"."User_global_ratings" (
    "user_uid" TEXT NOT NULL,
    "sport_name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "infrastructure"."Partners" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partners_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Partner_opening_hours" (
    "uid" TEXT NOT NULL,
    "partner_uid" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_opening_hours_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Partner_sports" (
    "partner_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "infrastructure"."Sports" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sports_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Fields" (
    "uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "partner_uid" TEXT NOT NULL,
    "name" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "entry_fee" DOUBLE PRECISION NOT NULL,
    "game_mode" "sessions"."Game_modes" NOT NULL,

    CONSTRAINT "Fields_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Field_images" (
    "uid" TEXT NOT NULL,
    "field_uid" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_images_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "sessions"."Sessions" (
    "uid" TEXT NOT NULL,
    "field_uid" TEXT NOT NULL,
    "title" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "sport" TEXT NOT NULL,
    "game_mode" "sessions"."Game_modes" NOT NULL,
    "max_players_per_team" INTEGER NOT NULL,
    "teams_per_game" INTEGER NOT NULL,
    "min_players_per_team" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "sessions"."Session_invitations" (
    "session_uid" TEXT NOT NULL,
    "sender_uid" TEXT NOT NULL,
    "receiver_uid" TEXT NOT NULL,
    "status" "shared"."Invitation_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "sessions"."Session_images" (
    "uid" TEXT NOT NULL,
    "session_uid" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_images_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "sessions"."Session_teams" (
    "uid" TEXT NOT NULL,
    "session_uid" TEXT NOT NULL,
    "team_label" "sessions"."Team_label" NOT NULL,
    "team_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_teams_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "sessions"."Session_players" (
    "session_uid" TEXT NOT NULL,
    "team_uid" TEXT NOT NULL,
    "userUid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "social"."Conversations" (
    "uid" TEXT NOT NULL,
    "event_uid" TEXT,
    "name" TEXT,
    "type" "social"."Conversation_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversations_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "social"."Messages" (
    "uid" TEXT NOT NULL,
    "conversation_uid" TEXT NOT NULL,
    "sender_uid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "social"."Message_status" NOT NULL DEFAULT 'SENT',
    "type" "social"."Message_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "social"."Conversation_options" (
    "conversationUid" TEXT NOT NULL,
    "userUid" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "social"."Conversation_members" (
    "conversationUid" TEXT NOT NULL,
    "userUid" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Conversation_members_pkey" PRIMARY KEY ("conversationUid","userUid")
);

-- CreateTable
CREATE TABLE "social"."Friends" (
    "userUid1" TEXT NOT NULL,
    "userUid2" TEXT NOT NULL,
    "status" "shared"."Invitation_status" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("userUid1","userUid2")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "auth"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_stripe_account_uid_key" ON "auth"."Users"("stripe_account_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Refresh_tokens_token_key" ON "auth"."Refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "User_ratings_evaluator_uid_evaluated_uid_key" ON "ratings"."User_ratings"("evaluator_uid", "evaluated_uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_global_ratings_user_uid_sport_name_key" ON "ratings"."User_global_ratings"("user_uid", "sport_name");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_opening_hours_partner_uid_day_of_week_key" ON "infrastructure"."Partner_opening_hours"("partner_uid", "day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_sports_partner_uid_sport_key" ON "infrastructure"."Partner_sports"("partner_uid", "sport");

-- CreateIndex
CREATE UNIQUE INDEX "Sports_name_key" ON "infrastructure"."Sports"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Session_invitations_session_uid_sender_uid_receiver_uid_key" ON "sessions"."Session_invitations"("session_uid", "sender_uid", "receiver_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_teams_session_uid_team_label_key" ON "sessions"."Session_teams"("session_uid", "team_label");

-- CreateIndex
CREATE UNIQUE INDEX "Session_players_session_uid_team_uid_userUid_key" ON "sessions"."Session_players"("session_uid", "team_uid", "userUid");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_options_conversationUid_userUid_key" ON "social"."Conversation_options"("conversationUid", "userUid");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_userUid1_userUid2_key" ON "social"."Friends"("userUid1", "userUid2");

-- AddForeignKey
ALTER TABLE "auth"."Email_verification" ADD CONSTRAINT "Email_verification_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."User_tokens" ADD CONSTRAINT "User_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Refresh_tokens" ADD CONSTRAINT "Refresh_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_evaluator_uid_fkey" FOREIGN KEY ("evaluator_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_evaluated_uid_fkey" FOREIGN KEY ("evaluated_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_global_ratings" ADD CONSTRAINT "User_global_ratings_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_global_ratings" ADD CONSTRAINT "User_global_ratings_sport_name_fkey" FOREIGN KEY ("sport_name") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Partner_opening_hours" ADD CONSTRAINT "Partner_opening_hours_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Partner_sports" ADD CONSTRAINT "Partner_sports_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Partner_sports" ADD CONSTRAINT "Partner_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Fields" ADD CONSTRAINT "Fields_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Fields" ADD CONSTRAINT "Fields_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_images" ADD CONSTRAINT "Field_images_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_receiver_uid_fkey" FOREIGN KEY ("receiver_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_images" ADD CONSTRAINT "Session_images_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_teams" ADD CONSTRAINT "Session_teams_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_team_uid_fkey" FOREIGN KEY ("team_uid") REFERENCES "sessions"."Session_teams"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Messages" ADD CONSTRAINT "Messages_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Messages" ADD CONSTRAINT "Messages_conversation_uid_fkey" FOREIGN KEY ("conversation_uid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_options" ADD CONSTRAINT "Conversation_options_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_options" ADD CONSTRAINT "Conversation_options_conversationUid_fkey" FOREIGN KEY ("conversationUid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_members" ADD CONSTRAINT "Conversation_members_conversationUid_fkey" FOREIGN KEY ("conversationUid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_members" ADD CONSTRAINT "Conversation_members_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Friends" ADD CONSTRAINT "Friends_userUid1_fkey" FOREIGN KEY ("userUid1") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Friends" ADD CONSTRAINT "Friends_userUid2_fkey" FOREIGN KEY ("userUid2") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
