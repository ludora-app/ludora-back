-- Migration: tournaments schema + Currency enum + cash prize fields
-- Wrapped in a transaction for atomicity

BEGIN;

-- ============================================================================
-- 1. Create schemas
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS "tournaments";

-- ============================================================================
-- 2. Create enums (idempotent)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'shared' AND t.typname = 'Currency') THEN
        CREATE TYPE "shared"."Currency" AS ENUM ('EUR');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'tournament_status') THEN
        CREATE TYPE "tournaments"."tournament_status" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'tournament_format') THEN
        CREATE TYPE "tournaments"."tournament_format" AS ENUM ('SINGLE_ELIMINATION', 'GROUP_STAGE', 'ROUND_ROBIN', 'SWISS');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'staff_role') THEN
        CREATE TYPE "tournaments"."staff_role" AS ENUM ('REFEREE', 'SCOREKEEPER', 'ADMIN');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'team_status') THEN
        CREATE TYPE "tournaments"."team_status" AS ENUM ('ACTIVE', 'ELEMINATED', 'WINNER', 'FORFEIT', 'DISQUALIFIED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'match_status') THEN
        CREATE TYPE "tournaments"."match_status" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'cash_prize_type') THEN
        CREATE TYPE "tournaments"."cash_prize_type" AS ENUM ('MONETARY', 'OTHER');
    END IF;
END$$;

-- ============================================================================
-- 3. Safely convert Payments.currency from TEXT to Currency enum
--    Preserves existing data by casting through UPPER() to match enum values
-- ============================================================================

DO $$
BEGIN
    -- Only convert if the column is still TEXT (not already the enum)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'billing'
          AND table_name = 'Payments'
          AND column_name = 'currency'
          AND udt_name = 'text'
    ) THEN
        -- Add a temporary column with the enum type
        ALTER TABLE "billing"."Payments" ADD COLUMN "currency_new" "shared"."Currency";

        -- Convert existing data: uppercase the text value and cast to enum
        UPDATE "billing"."Payments"
        SET "currency_new" = UPPER("currency")::"shared"."Currency";

        -- Drop the old text column
        ALTER TABLE "billing"."Payments" DROP COLUMN "currency";

        -- Rename the new column
        ALTER TABLE "billing"."Payments" RENAME COLUMN "currency_new" TO "currency";

        -- Re-apply the NOT NULL constraint and default
        ALTER TABLE "billing"."Payments"
            ALTER COLUMN "currency" SET NOT NULL,
            ALTER COLUMN "currency" SET DEFAULT 'EUR'::"shared"."Currency";
    END IF;
END$$;

-- ============================================================================
-- 4. Create tournament tables (idempotent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "tournaments"."Tournaments" (
    "uid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "organizer_uid" TEXT,
    "format" "tournaments"."tournament_format" NOT NULL,
    "status" "tournaments"."tournament_status" NOT NULL,
    "entry_fee" INTEGER,
    "currency" "shared"."Currency",
    "cash_prize_type" "tournaments"."cash_prize_type",
    "cash_prize_amount" INTEGER,
    "cash_prize_description" TEXT,
    "description" TEXT,
    "visibility" "sessions"."session_visibility" NOT NULL DEFAULT 'PUBLIC',
    "max_teams" INTEGER NOT NULL,
    "players_per_team" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "registration_opens_at" TIMESTAMP(3) NOT NULL,
    "registration_closes_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournaments_pkey" PRIMARY KEY ("uid")
);

CREATE TABLE IF NOT EXISTS "tournaments"."Tournament_teams" (
    "uid" TEXT NOT NULL,
    "tournament_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "tournaments"."team_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_teams_pkey" PRIMARY KEY ("uid")
);

CREATE TABLE IF NOT EXISTS "tournaments"."Tournament_matches" (
    "uid" TEXT NOT NULL,
    "tournament_uid" TEXT NOT NULL,
    "field_uid" TEXT NOT NULL,
    "team_a_uid" TEXT NOT NULL,
    "team_b_uid" TEXT NOT NULL,
    "status" "tournaments"."match_status" NOT NULL DEFAULT 'SCHEDULED',
    "round" INTEGER NOT NULL,
    "score_a" INTEGER NOT NULL DEFAULT 0,
    "score_b" INTEGER NOT NULL DEFAULT 0,
    "winner_team_uid" TEXT,
    "next_match_uid" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_matches_pkey" PRIMARY KEY ("uid")
);

CREATE TABLE IF NOT EXISTS "tournaments"."Tournament_registrations" (
    "uid" TEXT NOT NULL,
    "tournament_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "team_uid" TEXT,
    "status" "shared"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reviewed_by" TEXT,

    CONSTRAINT "Tournament_registrations_pkey" PRIMARY KEY ("uid")
);

CREATE TABLE IF NOT EXISTS "tournaments"."Tournament_staff" (
    "uid" TEXT NOT NULL,
    "tournament_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "role" "tournaments"."staff_role" NOT NULL,

    CONSTRAINT "Tournament_staff_pkey" PRIMARY KEY ("uid")
);

-- ============================================================================
-- 5. Add foreign keys (idempotent — skip if constraint already exists)
-- ============================================================================

DO $$
BEGIN
    -- Tournaments -> Sports
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournaments_sport_fkey') THEN
        ALTER TABLE "tournaments"."Tournaments" ADD CONSTRAINT "Tournaments_sport_fkey"
            FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Tournaments -> Users (organizer)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournaments_organizer_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournaments" ADD CONSTRAINT "Tournaments_organizer_uid_fkey"
            FOREIGN KEY ("organizer_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Tournament_teams -> Tournaments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_teams_tournament_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_teams" ADD CONSTRAINT "Tournament_teams_tournament_uid_fkey"
            FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_matches -> Tournaments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_tournament_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_tournament_uid_fkey"
            FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_matches -> Fields
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_field_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_field_uid_fkey"
            FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Tournament_matches -> Tournament_teams (team A)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_team_a_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_team_a_uid_fkey"
            FOREIGN KEY ("team_a_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_matches -> Tournament_teams (team B)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_team_b_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_team_b_uid_fkey"
            FOREIGN KEY ("team_b_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_matches -> Tournament_teams (winner)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_winner_team_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_winner_team_uid_fkey"
            FOREIGN KEY ("winner_team_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Tournament_matches -> Tournament_matches (next match — self-relation)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_next_match_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_next_match_uid_fkey"
            FOREIGN KEY ("next_match_uid") REFERENCES "tournaments"."Tournament_matches"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Tournament_registrations -> Users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_registrations_user_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_registrations" ADD CONSTRAINT "Tournament_registrations_user_uid_fkey"
            FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_registrations -> Tournaments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_registrations_tournament_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_registrations" ADD CONSTRAINT "Tournament_registrations_tournament_uid_fkey"
            FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_registrations -> Tournament_teams
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_registrations_team_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_registrations" ADD CONSTRAINT "Tournament_registrations_team_uid_fkey"
            FOREIGN KEY ("team_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_staff -> Users
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_staff_user_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_staff" ADD CONSTRAINT "Tournament_staff_user_uid_fkey"
            FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Tournament_staff -> Tournaments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_staff_tournament_uid_fkey') THEN
        ALTER TABLE "tournaments"."Tournament_staff" ADD CONSTRAINT "Tournament_staff_tournament_uid_fkey"
            FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;

COMMIT;
