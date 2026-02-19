-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "infrastructure";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notifications";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ratings";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "sessions";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "shared";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "social";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_preferences";

-- CreateEnum
CREATE TYPE "auth"."Provider" AS ENUM ('FACEBOOK', 'GOOGLE', 'LUDORA');

-- CreateEnum
CREATE TYPE "auth"."Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "auth"."UserType" AS ENUM ('USER', 'ADMIN', 'PARTNER');

-- CreateEnum
CREATE TYPE "infrastructure"."field_type" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "infrastructure"."verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "notifications"."notification_type" AS ENUM ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'SESSION_INVITATION', 'SESSION_UPDATED', 'SESSION_CANCELLED', 'SESSION_REMINDER', 'NEW_MESSAGE', 'GENERAL', 'EMAIL_VERIFIED', 'MESSAGE_SENT', 'MESSAGES_READ', 'SESSION_PLAYER_ADDED');

-- CreateEnum
CREATE TYPE "notifications"."platform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "sessions"."team_labels" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "sessions"."game_modes" AS ENUM ('ONE_V_ONE', 'TWO_V_TWO', 'THREE_V_THREE', 'FOUR_V_FOUR', 'FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'EIGHT_V_EIGHT', 'TEN_V_TEN', 'ELEVEN_V_ELEVEN');

-- CreateEnum
CREATE TYPE "sessions"."session_visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "shared"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "social"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'DELETED');

-- CreateEnum
CREATE TYPE "social"."Message_type" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "social"."ConversationType" AS ENUM ('PRIVATE', 'GROUP', 'SESSION');

-- CreateEnum
CREATE TYPE "user_preferences"."User_hour_preference_type" AS ENUM ('RECURRENT', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "user_preferences"."Time_period" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

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
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "provider" "auth"."Provider" NOT NULL DEFAULT 'LUDORA',
    "is_connected" BOOLEAN NOT NULL DEFAULT true,
    "stripe_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "type" "auth"."UserType" NOT NULL DEFAULT 'USER',

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
    "organisation_uid" TEXT,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_tokens_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "auth"."Refresh_tokens" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "organisation_uid" TEXT,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refresh_tokens_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Partners" (
    "uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "zip_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "department" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partners_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Fields" (
    "uid" TEXT NOT NULL,
    "type" "infrastructure"."field_type" NOT NULL DEFAULT 'PUBLIC',
    "status" "infrastructure"."verification_status" NOT NULL DEFAULT 'PENDING',
    "partner_uid" TEXT,
    "name" TEXT,
    "zip_code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "department" TEXT,
    "country" TEXT NOT NULL DEFAULT 'FR',
    "address" TEXT NOT NULL,
    "short_address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fields_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Field_slots" (
    "uid" TEXT NOT NULL,
    "field_uid" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "game_mode" "sessions"."game_modes" NOT NULL DEFAULT 'FIVE_V_FIVE',
    "price" DOUBLE PRECISION NOT NULL,
    "is_reserved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Field_slots_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "infrastructure"."Field_sports" (
    "field_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
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
CREATE TABLE "notifications"."Notifications" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "type" "notifications"."notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sent_via_push" BOOLEAN NOT NULL DEFAULT false,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "Notifications_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "notifications"."Devices" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "fcm_token" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "app_version" TEXT,
    "os_version" TEXT,
    "platform" "notifications"."platform",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devices_pkey" PRIMARY KEY ("uid")
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
CREATE TABLE "sessions"."Sessions" (
    "uid" TEXT NOT NULL,
    "field_uid" TEXT NOT NULL,
    "slot_uid" TEXT,
    "title" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "sport" TEXT NOT NULL,
    "game_mode" "sessions"."game_modes" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "creator_uid" TEXT NOT NULL,
    "max_players_per_team" INTEGER NOT NULL,
    "teams_per_game" INTEGER NOT NULL,
    "min_players_per_team" INTEGER NOT NULL,
    "description" TEXT,
    "visibility" "sessions"."session_visibility" NOT NULL DEFAULT 'PUBLIC',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "sessions"."Session_invitations" (
    "session_uid" TEXT NOT NULL,
    "sender_uid" TEXT NOT NULL,
    "receiver_uid" TEXT NOT NULL,
    "status" "shared"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
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
    "team_label" "sessions"."team_labels" NOT NULL,
    "team_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_teams_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "sessions"."Session_players" (
    "session_uid" TEXT NOT NULL,
    "team_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "social"."Conversations" (
    "uid" TEXT NOT NULL,
    "session_uid" TEXT,
    "name" TEXT,
    "type" "social"."ConversationType" NOT NULL,
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
    "global_status" "social"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "type" "social"."Message_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "social"."Message_receipts" (
    "message_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "status" "social"."MessageStatus" NOT NULL DEFAULT 'DELIVERED',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_receipts_pkey" PRIMARY KEY ("message_uid","user_uid")
);

-- CreateTable
CREATE TABLE "social"."Conversation_members" (
    "conversation_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_messages_after" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),

    CONSTRAINT "Conversation_members_pkey" PRIMARY KEY ("conversation_uid","user_uid")
);

-- CreateTable
CREATE TABLE "social"."Friends" (
    "user_uid_1" TEXT NOT NULL,
    "user_uid_2" TEXT NOT NULL,
    "status" "shared"."InvitationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("user_uid_1","user_uid_2")
);

-- CreateTable
CREATE TABLE "user_preferences"."User_sports" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_sports_pkey" PRIMARY KEY ("uid")
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

    CONSTRAINT "User_hour_preferences_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "user_preferences"."User_game_mode_preferences" (
    "uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "gameMode" "sessions"."game_modes" NOT NULL,
    "sport" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_game_mode_preferences_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "auth"."Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_stripe_account_id_key" ON "auth"."Users"("stripe_account_id");

-- CreateIndex
CREATE INDEX "Users_created_at_idx" ON "auth"."Users"("created_at");

-- CreateIndex
CREATE INDEX "Users_is_connected_idx" ON "auth"."Users"("is_connected");

-- CreateIndex
CREATE INDEX "Email_verification_user_uid_idx" ON "auth"."Email_verification"("user_uid");

-- CreateIndex
CREATE INDEX "User_tokens_user_uid_idx" ON "auth"."User_tokens"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Refresh_tokens_token_key" ON "auth"."Refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "Refresh_tokens_user_uid_idx" ON "auth"."Refresh_tokens"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Partners_name_key" ON "infrastructure"."Partners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Partners_email_key" ON "infrastructure"."Partners"("email");

-- CreateIndex
CREATE INDEX "Partners_city_idx" ON "infrastructure"."Partners"("city");

-- CreateIndex
CREATE INDEX "Partners_zip_code_idx" ON "infrastructure"."Partners"("zip_code");

-- CreateIndex
CREATE INDEX "Fields_partner_uid_idx" ON "infrastructure"."Fields"("partner_uid");

-- CreateIndex
CREATE INDEX "Fields_longitude_latitude_idx" ON "infrastructure"."Fields"("longitude", "latitude");

-- CreateIndex
CREATE INDEX "Fields_type_idx" ON "infrastructure"."Fields"("type");

-- CreateIndex
CREATE INDEX "Fields_status_idx" ON "infrastructure"."Fields"("status");

-- CreateIndex
CREATE INDEX "Fields_city_idx" ON "infrastructure"."Fields"("city");

-- CreateIndex
CREATE INDEX "Fields_zip_code_idx" ON "infrastructure"."Fields"("zip_code");

-- CreateIndex
CREATE INDEX "Field_slots_field_uid_idx" ON "infrastructure"."Field_slots"("field_uid");

-- CreateIndex
CREATE INDEX "Field_slots_start_time_end_time_idx" ON "infrastructure"."Field_slots"("start_time", "end_time");

-- CreateIndex
CREATE INDEX "Field_sports_field_uid_idx" ON "infrastructure"."Field_sports"("field_uid");

-- CreateIndex
CREATE INDEX "Field_sports_sport_idx" ON "infrastructure"."Field_sports"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "Field_sports_field_uid_sport_key" ON "infrastructure"."Field_sports"("field_uid", "sport");

-- CreateIndex
CREATE INDEX "Partner_sports_partner_uid_idx" ON "infrastructure"."Partner_sports"("partner_uid");

-- CreateIndex
CREATE INDEX "Partner_sports_sport_idx" ON "infrastructure"."Partner_sports"("sport");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_sports_partner_uid_sport_key" ON "infrastructure"."Partner_sports"("partner_uid", "sport");

-- CreateIndex
CREATE UNIQUE INDEX "Sports_name_key" ON "infrastructure"."Sports"("name");

-- CreateIndex
CREATE INDEX "Field_images_field_uid_idx" ON "infrastructure"."Field_images"("field_uid");

-- CreateIndex
CREATE INDEX "Notifications_user_uid_is_read_idx" ON "notifications"."Notifications"("user_uid", "is_read");

-- CreateIndex
CREATE INDEX "Notifications_created_at_idx" ON "notifications"."Notifications"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Devices_fcm_token_key" ON "notifications"."Devices"("fcm_token");

-- CreateIndex
CREATE INDEX "Devices_user_uid_idx" ON "notifications"."Devices"("user_uid");

-- CreateIndex
CREATE INDEX "Devices_fcm_token_idx" ON "notifications"."Devices"("fcm_token");

-- CreateIndex
CREATE INDEX "User_ratings_evaluated_uid_idx" ON "ratings"."User_ratings"("evaluated_uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_ratings_evaluator_uid_evaluated_uid_key" ON "ratings"."User_ratings"("evaluator_uid", "evaluated_uid");

-- CreateIndex
CREATE UNIQUE INDEX "User_global_ratings_user_uid_sport_name_key" ON "ratings"."User_global_ratings"("user_uid", "sport_name");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_slot_uid_key" ON "sessions"."Sessions"("slot_uid");

-- CreateIndex
CREATE INDEX "Sessions_field_uid_start_date_end_date_idx" ON "sessions"."Sessions"("field_uid", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "Session_invitations_session_uid_idx" ON "sessions"."Session_invitations"("session_uid");

-- CreateIndex
CREATE INDEX "Session_invitations_receiver_uid_idx" ON "sessions"."Session_invitations"("receiver_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_invitations_session_uid_sender_uid_receiver_uid_key" ON "sessions"."Session_invitations"("session_uid", "sender_uid", "receiver_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_teams_session_uid_team_label_key" ON "sessions"."Session_teams"("session_uid", "team_label");

-- CreateIndex
CREATE INDEX "Session_players_session_uid_idx" ON "sessions"."Session_players"("session_uid");

-- CreateIndex
CREATE INDEX "Session_players_user_uid_idx" ON "sessions"."Session_players"("user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Session_players_session_uid_user_uid_key" ON "sessions"."Session_players"("session_uid", "user_uid");

-- CreateIndex
CREATE UNIQUE INDEX "Conversations_session_uid_key" ON "social"."Conversations"("session_uid");

-- CreateIndex
CREATE INDEX "Messages_conversation_uid_created_at_idx" ON "social"."Messages"("conversation_uid", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Message_receipts_message_uid_idx" ON "social"."Message_receipts"("message_uid");

-- CreateIndex
CREATE INDEX "Conversation_members_user_uid_is_visible_is_archived_idx" ON "social"."Conversation_members"("user_uid", "is_visible", "is_archived");

-- CreateIndex
CREATE INDEX "Friends_user_uid_1_idx" ON "social"."Friends"("user_uid_1");

-- CreateIndex
CREATE INDEX "Friends_user_uid_2_idx" ON "social"."Friends"("user_uid_2");

-- CreateIndex
CREATE UNIQUE INDEX "Friends_user_uid_1_user_uid_2_key" ON "social"."Friends"("user_uid_1", "user_uid_2");

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
CREATE INDEX "User_game_mode_preferences_user_uid_idx" ON "user_preferences"."User_game_mode_preferences"("user_uid");

-- CreateIndex
CREATE INDEX "User_game_mode_preferences_gameMode_idx" ON "user_preferences"."User_game_mode_preferences"("gameMode");

-- CreateIndex
CREATE INDEX "User_game_mode_preferences_user_uid_sport_idx" ON "user_preferences"."User_game_mode_preferences"("user_uid", "sport");

-- CreateIndex
CREATE UNIQUE INDEX "User_game_mode_preferences_user_uid_gameMode_sport_key" ON "user_preferences"."User_game_mode_preferences"("user_uid", "gameMode", "sport");

-- AddForeignKey
ALTER TABLE "auth"."Email_verification" ADD CONSTRAINT "Email_verification_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."User_tokens" ADD CONSTRAINT "User_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."User_tokens" ADD CONSTRAINT "User_tokens_organisation_uid_fkey" FOREIGN KEY ("organisation_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Refresh_tokens" ADD CONSTRAINT "Refresh_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."Refresh_tokens" ADD CONSTRAINT "Refresh_tokens_organisation_uid_fkey" FOREIGN KEY ("organisation_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Fields" ADD CONSTRAINT "Fields_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_slots" ADD CONSTRAINT "Field_slots_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_sports" ADD CONSTRAINT "Field_sports_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_sports" ADD CONSTRAINT "Field_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Partner_sports" ADD CONSTRAINT "Partner_sports_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Partner_sports" ADD CONSTRAINT "Partner_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_images" ADD CONSTRAINT "Field_images_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"."Notifications" ADD CONSTRAINT "Notifications_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"."Devices" ADD CONSTRAINT "Devices_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_evaluator_uid_fkey" FOREIGN KEY ("evaluator_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_evaluated_uid_fkey" FOREIGN KEY ("evaluated_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_global_ratings" ADD CONSTRAINT "User_global_ratings_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_global_ratings" ADD CONSTRAINT "User_global_ratings_sport_name_fkey" FOREIGN KEY ("sport_name") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_creator_uid_fkey" FOREIGN KEY ("creator_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_slot_uid_fkey" FOREIGN KEY ("slot_uid") REFERENCES "infrastructure"."Field_slots"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Sessions" ADD CONSTRAINT "Sessions_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_receiver_uid_fkey" FOREIGN KEY ("receiver_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_images" ADD CONSTRAINT "Session_images_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_teams" ADD CONSTRAINT "Session_teams_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_team_uid_fkey" FOREIGN KEY ("team_uid") REFERENCES "sessions"."Session_teams"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversations" ADD CONSTRAINT "Conversations_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Messages" ADD CONSTRAINT "Messages_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Messages" ADD CONSTRAINT "Messages_conversation_uid_fkey" FOREIGN KEY ("conversation_uid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Message_receipts" ADD CONSTRAINT "Message_receipts_message_uid_fkey" FOREIGN KEY ("message_uid") REFERENCES "social"."Messages"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Message_receipts" ADD CONSTRAINT "Message_receipts_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_members" ADD CONSTRAINT "Conversation_members_conversation_uid_fkey" FOREIGN KEY ("conversation_uid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Conversation_members" ADD CONSTRAINT "Conversation_members_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Friends" ADD CONSTRAINT "Friends_user_uid_1_fkey" FOREIGN KEY ("user_uid_1") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Friends" ADD CONSTRAINT "Friends_user_uid_2_fkey" FOREIGN KEY ("user_uid_2") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_sports" ADD CONSTRAINT "User_sports_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_sports" ADD CONSTRAINT "User_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_hour_preferences" ADD CONSTRAINT "User_hour_preferences_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_game_mode_preferences" ADD CONSTRAINT "User_game_mode_preferences_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_game_mode_preferences" ADD CONSTRAINT "User_game_mode_preferences_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_game_mode_preferences" ADD CONSTRAINT "User_game_mode_preferences_user_uid_sport_fkey" FOREIGN KEY ("user_uid", "sport") REFERENCES "user_preferences"."User_sports"("user_uid", "sport") ON DELETE CASCADE ON UPDATE CASCADE;
