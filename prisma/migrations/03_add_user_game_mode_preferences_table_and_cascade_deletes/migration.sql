-- DropForeignKey
ALTER TABLE "auth"."User_tokens" DROP CONSTRAINT "User_tokens_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "infrastructure"."Field_images" DROP CONSTRAINT "Field_images_field_uid_fkey";

-- DropForeignKey
ALTER TABLE "infrastructure"."Partner_sports" DROP CONSTRAINT "Partner_sports_partner_uid_fkey";

-- DropForeignKey
ALTER TABLE "ratings"."User_global_ratings" DROP CONSTRAINT "User_global_ratings_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "ratings"."User_ratings" DROP CONSTRAINT "User_ratings_evaluated_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_images" DROP CONSTRAINT "Session_images_session_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_invitations" DROP CONSTRAINT "Session_invitations_session_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_players" DROP CONSTRAINT "Session_players_session_uid_fkey";

-- DropForeignKey
ALTER TABLE "sessions"."Session_teams" DROP CONSTRAINT "Session_teams_session_uid_fkey";

-- DropForeignKey
ALTER TABLE "social"."Friends" DROP CONSTRAINT "Friends_user_uid_1_fkey";

-- DropForeignKey
ALTER TABLE "social"."Friends" DROP CONSTRAINT "Friends_user_uid_2_fkey";

-- DropForeignKey
ALTER TABLE "user_preferences"."User_hour_preferences" DROP CONSTRAINT "User_hour_preferences_user_uid_fkey";

-- DropForeignKey
ALTER TABLE "user_preferences"."User_sports" DROP CONSTRAINT "User_sports_user_uid_fkey";

-- DropIndex
DROP INDEX "infrastructure"."idx_fields_name_trgm";

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
CREATE INDEX "User_game_mode_preferences_user_uid_idx" ON "user_preferences"."User_game_mode_preferences"("user_uid");

-- CreateIndex
CREATE INDEX "User_game_mode_preferences_gameMode_idx" ON "user_preferences"."User_game_mode_preferences"("gameMode");

-- CreateIndex
CREATE UNIQUE INDEX "User_game_mode_preferences_user_uid_gameMode_key" ON "user_preferences"."User_game_mode_preferences"("user_uid", "gameMode");

-- AddForeignKey
ALTER TABLE "auth"."User_tokens" ADD CONSTRAINT "User_tokens_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Partner_sports" ADD CONSTRAINT "Partner_sports_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "infrastructure"."Field_images" ADD CONSTRAINT "Field_images_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_ratings" ADD CONSTRAINT "User_ratings_evaluated_uid_fkey" FOREIGN KEY ("evaluated_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings"."User_global_ratings" ADD CONSTRAINT "User_global_ratings_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_invitations" ADD CONSTRAINT "Session_invitations_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_images" ADD CONSTRAINT "Session_images_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_teams" ADD CONSTRAINT "Session_teams_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions"."Session_players" ADD CONSTRAINT "Session_players_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Friends" ADD CONSTRAINT "Friends_user_uid_1_fkey" FOREIGN KEY ("user_uid_1") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Friends" ADD CONSTRAINT "Friends_user_uid_2_fkey" FOREIGN KEY ("user_uid_2") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_sports" ADD CONSTRAINT "User_sports_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_hour_preferences" ADD CONSTRAINT "User_hour_preferences_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_game_mode_preferences" ADD CONSTRAINT "User_game_mode_preferences_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences"."User_game_mode_preferences" ADD CONSTRAINT "User_game_mode_preferences_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
