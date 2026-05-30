/*
  Warnings:

  - The `currency` column on the `Payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/

-- Wrap in transaction for atomicity
BEGIN;

-- ============================================================================
-- SCHEMAS
-- ============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tournaments";

-- ============================================================================
-- ENUMS (idempotent creation)
-- ============================================================================

-- CreateEnum: shared.Currency
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'shared' AND t.typname = 'Currency') THEN
    CREATE TYPE "shared"."Currency" AS ENUM ('EUR');
  END IF;
END $$;

-- CreateEnum: tournaments.tournament_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'tournament_status') THEN
    CREATE TYPE "tournaments"."tournament_status" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ONGOING', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

-- CreateEnum: tournaments.tournament_format
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'tournament_format') THEN
    CREATE TYPE "tournaments"."tournament_format" AS ENUM ('SINGLE_ELIMINATION', 'GROUP_STAGE', 'ROUND_ROBIN', 'SWISS');
  END IF;
END $$;

-- CreateEnum: tournaments.staff_role
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'staff_role') THEN
    CREATE TYPE "tournaments"."staff_role" AS ENUM ('REFEREE', 'SCOREKEEPER', 'ADMIN');
  END IF;
END $$;

-- CreateEnum: tournaments.team_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'team_status') THEN
    CREATE TYPE "tournaments"."team_status" AS ENUM ('ACTIVE', 'ELEMINATED', 'WINNER', 'FORFEIT', 'DISQUALIFIED');
  END IF;
END $$;

-- CreateEnum: tournaments.match_status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'match_status') THEN
    CREATE TYPE "tournaments"."match_status" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');
  END IF;
END $$;

-- CreateEnum: tournaments.cash_prize_type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'tournaments' AND t.typname = 'cash_prize_type') THEN
    CREATE TYPE "tournaments"."cash_prize_type" AS ENUM ('MONETARY', 'OTHER');
  END IF;
END $$;

-- ============================================================================
-- ENUM VALUES (safe add - skip if already exists)
-- ============================================================================

-- AlterEnum: add TOURNAMENT_ORGANIZER to auth.user_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'auth' AND t.typname = 'user_type' AND e.enumlabel = 'TOURNAMENT_ORGANIZER'
  ) THEN
    ALTER TYPE "auth"."user_type" ADD VALUE 'TOURNAMENT_ORGANIZER';
  END IF;
END $$;

-- ============================================================================
-- ALTER EXISTING TABLES
-- ============================================================================

-- AlterTable: Payments.currency -> use shared.Currency enum
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'billing' AND table_name = 'Payments' AND column_name = 'currency'
      AND udt_schema || '.' || udt_name != 'shared.Currency'
  ) THEN
    ALTER TABLE "billing"."Payments" DROP COLUMN "currency";
    ALTER TABLE "billing"."Payments" ADD COLUMN "currency" "shared"."Currency" NOT NULL DEFAULT 'EUR';
  END IF;
END $$;

-- ============================================================================
-- CREATE TABLES (IF NOT EXISTS)
-- ============================================================================

-- CreateTable: Tournaments
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

-- CreateTable: Tournament_teams
CREATE TABLE IF NOT EXISTS "tournaments"."Tournament_teams" (
    "uid" TEXT NOT NULL,
    "tournament_uid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "tournaments"."team_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_teams_pkey" PRIMARY KEY ("uid")
);

-- CreateTable: Tournament_matches
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

-- CreateTable: Tournament_registrations
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

-- CreateTable: Tournament_staff
CREATE TABLE IF NOT EXISTS "tournaments"."Tournament_staff" (
    "uid" TEXT NOT NULL,
    "tournament_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "role" "tournaments"."staff_role" NOT NULL,

    CONSTRAINT "Tournament_staff_pkey" PRIMARY KEY ("uid")
);

-- ============================================================================
-- FOREIGN KEYS (idempotent - skip if constraint already exists)
-- ============================================================================

-- FK: Tournaments.sport -> Sports.name
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournaments_sport_fkey') THEN
    ALTER TABLE "tournaments"."Tournaments" ADD CONSTRAINT "Tournaments_sport_fkey" FOREIGN KEY ("sport") REFERENCES "infrastructure"."Sports"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournaments.organizer_uid -> Users.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournaments_organizer_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournaments" ADD CONSTRAINT "Tournaments_organizer_uid_fkey" FOREIGN KEY ("organizer_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_teams.tournament_uid -> Tournaments.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_teams_tournament_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_teams" ADD CONSTRAINT "Tournament_teams_tournament_uid_fkey" FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_matches.tournament_uid -> Tournaments.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_tournament_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_tournament_uid_fkey" FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_matches.field_uid -> Fields.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_field_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_field_uid_fkey" FOREIGN KEY ("field_uid") REFERENCES "infrastructure"."Fields"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_matches.team_a_uid -> Tournament_teams.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_team_a_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_team_a_uid_fkey" FOREIGN KEY ("team_a_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_matches.team_b_uid -> Tournament_teams.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_team_b_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_team_b_uid_fkey" FOREIGN KEY ("team_b_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_matches.winner_team_uid -> Tournament_teams.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_winner_team_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_winner_team_uid_fkey" FOREIGN KEY ("winner_team_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_matches.next_match_uid -> Tournament_matches.uid (self-ref)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_matches_next_match_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_matches" ADD CONSTRAINT "Tournament_matches_next_match_uid_fkey" FOREIGN KEY ("next_match_uid") REFERENCES "tournaments"."Tournament_matches"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_registrations.user_uid -> Users.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_registrations_user_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_registrations" ADD CONSTRAINT "Tournament_registrations_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_registrations.tournament_uid -> Tournaments.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_registrations_tournament_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_registrations" ADD CONSTRAINT "Tournament_registrations_tournament_uid_fkey" FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_registrations.team_uid -> Tournament_teams.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_registrations_team_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_registrations" ADD CONSTRAINT "Tournament_registrations_team_uid_fkey" FOREIGN KEY ("team_uid") REFERENCES "tournaments"."Tournament_teams"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_staff.user_uid -> Users.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_staff_user_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_staff" ADD CONSTRAINT "Tournament_staff_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: Tournament_staff.tournament_uid -> Tournaments.uid
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Tournament_staff_tournament_uid_fkey') THEN
    ALTER TABLE "tournaments"."Tournament_staff" ADD CONSTRAINT "Tournament_staff_tournament_uid_fkey" FOREIGN KEY ("tournament_uid") REFERENCES "tournaments"."Tournaments"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

COMMIT;
