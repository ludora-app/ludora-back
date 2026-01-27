-- ============================================
-- LUDORA DATABASE MIGRATION SCRIPT
-- Generated from Prisma schemas
-- ============================================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS "auth";
CREATE SCHEMA IF NOT EXISTS "ratings";
CREATE SCHEMA IF NOT EXISTS "infrastructure";
CREATE SCHEMA IF NOT EXISTS "sessions";
CREATE SCHEMA IF NOT EXISTS "social";
CREATE SCHEMA IF NOT EXISTS "shared";
CREATE SCHEMA IF NOT EXISTS "user_preferences";
CREATE SCHEMA IF NOT EXISTS "notifications";

-- ============================================
-- ENUMS
-- ============================================

-- Auth enums
CREATE TYPE "auth"."Provider" AS ENUM ('FACEBOOK', 'GOOGLE', 'LUDORA');
CREATE TYPE "auth"."Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE "auth"."UserType" AS ENUM ('USER', 'ADMIN', 'PARTNER');

-- Shared enums
CREATE TYPE "shared"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELED');

-- Sessions enums
CREATE TYPE "sessions"."team_labels" AS ENUM ('A', 'B');
CREATE TYPE "sessions"."game_modes" AS ENUM ('ONE_V_ONE', 'TWO_V_TWO', 'THREE_V_THREE', 'FOUR_V_FOUR', 'FIVE_V_FIVE', 'SIX_V_SIX', 'SEVEN_V_SEVEN', 'EIGHT_V_EIGHT', 'TEN_V_TEN', 'ELEVEN_V_ELEVEN');
CREATE TYPE "sessions"."session_visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- Infrastructure enums
CREATE TYPE "infrastructure"."field_type" AS ENUM ('PUBLIC', 'PRIVATE');
CREATE TYPE "infrastructure"."verification_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Social enums
CREATE TYPE "social"."MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');
CREATE TYPE "social"."Message_type" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO');
CREATE TYPE "social"."ConversationType" AS ENUM ('PRIVATE', 'GROUP', 'SESSION');

-- User preferences enums
CREATE TYPE "user_preferences"."User_hour_preference_type" AS ENUM ('RECURRENT', 'ONE_TIME');
CREATE TYPE "user_preferences"."Time_period" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- Notifications enums
CREATE TYPE "notifications"."notification_type" AS ENUM ('FRIEND_REQUEST', 'FRIEND_ACCEPTED', 'SESSION_INVITATION', 'SESSION_UPDATED', 'SESSION_CANCELLED', 'SESSION_REMINDER', 'NEW_MESSAGE', 'GENERAL', 'EMAIL_VERIFIED');
CREATE TYPE "notifications"."platform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- ============================================
-- INFRASTRUCTURE SCHEMA TABLES
-- ============================================

CREATE TABLE "infrastructure"."Partners" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "image_url" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "infrastructure"."Sports" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "infrastructure"."Fields" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "type" "infrastructure"."field_type" NOT NULL DEFAULT 'PUBLIC',
    "status" "infrastructure"."verification_status" NOT NULL DEFAULT 'PENDING',
    "sport" TEXT NOT NULL,
    "partner_uid" TEXT,
    "name" TEXT,
    "address" TEXT NOT NULL,
    "short_address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Fields_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Fields_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "infrastructure"."Field_slots" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "field_uid" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "game_mode" "sessions"."game_modes" NOT NULL DEFAULT 'FIVE_V_FIVE',
    "price" DOUBLE PRECISION NOT NULL,
    "is_reserved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Field_slots_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "infrastructure"."Partner_sports" (
    "partner_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("partner_uid", "sport"),
    CONSTRAINT "Partner_sports_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Partner_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "infrastructure"."Field_images" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "field_uid" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Field_images_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================
-- AUTH SCHEMA TABLES
-- ============================================

CREATE TABLE "auth"."Users" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
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
    "stripe_account_id" TEXT UNIQUE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "type" "auth"."UserType" NOT NULL DEFAULT 'USER'
);

CREATE TABLE "auth"."Email_verification" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Email_verification_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "auth"."User_tokens" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "device_uid" TEXT,
    "organisation_uid" TEXT,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_tokens_organisation_uid_fkey" FOREIGN KEY ("organisation_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "auth"."Refresh_tokens" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "device_uid" TEXT,
    "organisation_uid" TEXT,
    "token" TEXT NOT NULL UNIQUE,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Refresh_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Refresh_tokens_organisation_uid_fkey" FOREIGN KEY ("organisation_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- SESSIONS SCHEMA TABLES
-- ============================================

CREATE TABLE "sessions"."Sessions" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "field_uid" TEXT NOT NULL,
    "slot_uid" TEXT UNIQUE,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sessions_creator_uid_fkey" FOREIGN KEY ("creator_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sessions_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sessions_slot_uid_fkey" FOREIGN KEY ("slot_uid") REFERENCES "infrastructure"."Field_slots"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sessions_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sessions"."Session_invitations" (
    "session_uid" TEXT NOT NULL,
    "sender_uid" TEXT NOT NULL,
    "receiver_uid" TEXT NOT NULL,
    "status" "shared"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("session_uid", "sender_uid", "receiver_uid"),
    CONSTRAINT "Session_invitations_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_invitations_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_invitations_receiver_uid_fkey" FOREIGN KEY ("receiver_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sessions"."Session_images" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "session_uid" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_images_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "sessions"."Session_teams" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "session_uid" TEXT NOT NULL,
    "team_label" "sessions"."team_labels" NOT NULL,
    "team_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_teams_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("session_uid", "team_label")
);

CREATE TABLE "sessions"."Session_players" (
    "session_uid" TEXT NOT NULL,
    "team_uid" TEXT NOT NULL,
    "userUid" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("session_uid", "userUid"),
    CONSTRAINT "Session_players_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_players_team_uid_fkey" FOREIGN KEY ("team_uid") REFERENCES "sessions"."Session_teams"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_players_userUid_fkey" FOREIGN KEY ("userUid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================
-- SOCIAL SCHEMA TABLES
-- ============================================

CREATE TABLE "social"."Conversations" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "session_uid" TEXT UNIQUE,
    "name" TEXT,
    "type" "social"."ConversationType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversations_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "social"."Messages" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "conversation_uid" TEXT NOT NULL,
    "sender_uid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "global_status" "social"."MessageStatus" NOT NULL DEFAULT 'SENT',
    "type" "social"."Message_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Messages_sender_uid_fkey" FOREIGN KEY ("sender_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Messages_conversation_uid_fkey" FOREIGN KEY ("conversation_uid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "social"."Message_receipts" (
    "message_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "status" "social"."MessageStatus" NOT NULL DEFAULT 'DELIVERED',
    "updated_at" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("message_uid", "user_uid"),
    CONSTRAINT "Message_receipts_message_uid_fkey" FOREIGN KEY ("message_uid") REFERENCES "social"."Messages"("uid") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receipts_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "social"."Conversation_members" (
    "conversation_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "display_messages_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_read_at" TIMESTAMP(3),
    PRIMARY KEY ("conversation_uid", "user_uid"),
    CONSTRAINT "Conversation_members_conversation_uid_fkey" FOREIGN KEY ("conversation_uid") REFERENCES "social"."Conversations"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Conversation_members_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "social"."Friends" (
    "user_uid_1" TEXT NOT NULL,
    "user_uid_2" TEXT NOT NULL,
    "status" "shared"."InvitationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    PRIMARY KEY ("user_uid_1", "user_uid_2"),
    CONSTRAINT "Friends_user_uid_1_fkey" FOREIGN KEY ("user_uid_1") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Friends_user_uid_2_fkey" FOREIGN KEY ("user_uid_2") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================
-- RATINGS SCHEMA TABLES
-- ============================================

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
    PRIMARY KEY ("evaluator_uid", "evaluated_uid"),
    CONSTRAINT "User_ratings_evaluator_uid_fkey" FOREIGN KEY ("evaluator_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_ratings_evaluated_uid_fkey" FOREIGN KEY ("evaluated_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ratings"."User_global_ratings" (
    "user_uid" TEXT NOT NULL,
    "sport_name" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_global_ratings_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_global_ratings_sport_name_fkey" FOREIGN KEY ("sport_name") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("user_uid", "sport_name")
);

-- ============================================
-- USER PREFERENCES SCHEMA TABLES
-- ============================================

CREATE TABLE "user_preferences"."User_sports" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_sports_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_sports_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE ("user_uid", "sport")
);

CREATE TABLE "user_preferences"."User_hour_preferences" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "type" "user_preferences"."User_hour_preference_type" NOT NULL,
    "user_uid" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time_period" "user_preferences"."Time_period" NOT NULL,
    "date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_hour_preferences_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ============================================
-- NOTIFICATIONS SCHEMA TABLES
-- ============================================

CREATE TABLE "notifications"."Notifications" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "type" "notifications"."notification_type" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sent_via_push" BOOLEAN NOT NULL DEFAULT false,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    CONSTRAINT "Notifications_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "notifications"."Devices" (
    "uid" TEXT NOT NULL PRIMARY KEY,
    "user_uid" TEXT NOT NULL,
    "fcm_token" TEXT NOT NULL UNIQUE,
    "device_id" TEXT NOT NULL,
    "app_version" TEXT,
    "os_version" TEXT,
    "platform" "notifications"."platform",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Devices_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ============================================
-- INDEXES
-- ============================================

-- Auth indexes
CREATE INDEX "Users_created_at_idx" ON "auth"."Users"("created_at");
CREATE INDEX "Users_is_connected_idx" ON "auth"."Users"("is_connected");
CREATE INDEX "Email_verification_user_uid_idx" ON "auth"."Email_verification"("user_uid");
CREATE INDEX "User_tokens_user_uid_idx" ON "auth"."User_tokens"("user_uid");
CREATE INDEX "Refresh_tokens_user_uid_idx" ON "auth"."Refresh_tokens"("user_uid");

-- Infrastructure indexes
CREATE INDEX "Fields_partner_uid_idx" ON "infrastructure"."Fields"("partner_uid");
CREATE INDEX "Fields_longitude_latitude_idx" ON "infrastructure"."Fields"("longitude", "latitude");
CREATE INDEX "Fields_sport_idx" ON "infrastructure"."Fields"("sport");
CREATE INDEX "Fields_type_idx" ON "infrastructure"."Fields"("type");
CREATE INDEX "Fields_status_idx" ON "infrastructure"."Fields"("status");
CREATE INDEX "Field_slots_field_uid_idx" ON "infrastructure"."Field_slots"("field_uid");
CREATE INDEX "Field_slots_start_time_end_time_idx" ON "infrastructure"."Field_slots"("start_time", "end_time");
CREATE INDEX "Partner_sports_partner_uid_idx" ON "infrastructure"."Partner_sports"("partner_uid");
CREATE INDEX "Partner_sports_sport_idx" ON "infrastructure"."Partner_sports"("sport");
CREATE INDEX "Field_images_field_uid_idx" ON "infrastructure"."Field_images"("field_uid");

-- Sessions indexes
CREATE INDEX "Sessions_field_uid_start_date_end_date_idx" ON "sessions"."Sessions"("field_uid", "start_date", "end_date");
CREATE INDEX "Session_invitations_session_uid_idx" ON "sessions"."Session_invitations"("session_uid");
CREATE INDEX "Session_invitations_receiver_uid_idx" ON "sessions"."Session_invitations"("receiver_uid");
CREATE INDEX "Session_players_session_uid_idx" ON "sessions"."Session_players"("session_uid");
CREATE INDEX "Session_players_userUid_idx" ON "sessions"."Session_players"("userUid");

-- Social indexes
CREATE INDEX "Messages_conversation_uid_created_at_idx" ON "social"."Messages"("conversation_uid", "created_at" DESC);
CREATE INDEX "Message_receipts_message_uid_idx" ON "social"."Message_receipts"("message_uid");
CREATE INDEX "Conversation_members_user_uid_is_visible_is_archived_idx" ON "social"."Conversation_members"("user_uid", "is_visible", "is_archived");
CREATE INDEX "Friends_user_uid_1_idx" ON "social"."Friends"("user_uid_1");
CREATE INDEX "Friends_user_uid_2_idx" ON "social"."Friends"("user_uid_2");

-- Ratings indexes
CREATE INDEX "User_ratings_evaluated_uid_idx" ON "ratings"."User_ratings"("evaluated_uid");

-- User preferences indexes
CREATE INDEX "User_sports_user_uid_idx" ON "user_preferences"."User_sports"("user_uid");
CREATE INDEX "User_sports_sport_idx" ON "user_preferences"."User_sports"("sport");
CREATE INDEX "User_hour_preferences_user_uid_idx" ON "user_preferences"."User_hour_preferences"("user_uid");
CREATE INDEX "User_hour_preferences_time_period_idx" ON "user_preferences"."User_hour_preferences"("time_period");
CREATE INDEX "User_hour_preferences_day_of_week_idx" ON "user_preferences"."User_hour_preferences"("day_of_week");

-- Notifications indexes
CREATE INDEX "Notifications_user_uid_is_read_idx" ON "notifications"."Notifications"("user_uid", "is_read");
CREATE INDEX "Notifications_created_at_idx" ON "notifications"."Notifications"("created_at" DESC);
CREATE INDEX "Devices_user_uid_idx" ON "notifications"."Devices"("user_uid");
CREATE INDEX "Devices_fcm_token_idx" ON "notifications"."Devices"("fcm_token");

-- ============================================
-- PRISMA MIGRATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP WITH TIME ZONE,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP WITH TIME ZONE,
    "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Insert initial migration record
INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "logs", "applied_steps_count", "started_at", "finished_at")
VALUES (
    gen_random_uuid()::text,
    'manual_migration',
    'manual_initial_migration',
    'Manual migration executed from manual_migration.sql',
    1,
    now(),
    now()
);

-- ============================================
-- END OF MIGRATION
-- ============================================
