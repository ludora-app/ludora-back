/*
  Warnings:

  - You are about to drop the column `stripe_account_id` on the `Users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `Users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reporter_uid,reported_uid,reason]` on the table `User_reports` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "billing";

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "billing"."payment_status" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "billing"."RefundReason" AS ENUM ('CUSTOMER_CANCELLED', 'PARTNER_CANCELLED', 'TECHNICAL_ERROR', 'FRAUD', 'OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "billing"."RefundStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "billing"."StripeAccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESTRICTED', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "billing"."StripeEventStatus" AS ENUM ('PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- DropIndex
DROP INDEX IF EXISTS "auth"."Users_stripe_account_id_key";

-- AlterTable
ALTER TABLE "auth"."Users" DROP COLUMN IF EXISTS "stripe_account_id";
ALTER TABLE "auth"."Users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "billing"."Payments" (
    "uid" TEXT NOT NULL,
    "session_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "partner_uid" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "stripe_charge_id" TEXT,
    "stripe_transfer_id" TEXT,
    "amount" INTEGER NOT NULL,
    "amount_platform" INTEGER NOT NULL DEFAULT 0,
    "amount_partner" INTEGER NOT NULL DEFAULT 0,
    "commission_rate_snapshot" DECIMAL(5,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "metadata" JSONB,
    "status" "billing"."payment_status" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "billing"."Refunds" (
    "uid" TEXT NOT NULL,
    "payment_uid" TEXT NOT NULL,
    "stripe_refund_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" "billing"."RefundReason",
    "status" "billing"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "refunded_fee" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refunds_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "billing"."Stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "billing"."StripeEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "data" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "billing"."PartnerBillingConfig" (
    "partner_uid" TEXT NOT NULL,
    "stripe_account_id" TEXT,
    "stripe_account_status" "billing"."StripeAccountStatus" NOT NULL DEFAULT 'PENDING',
    "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "hours_before_full_refund" INTEGER NOT NULL DEFAULT 24,
    "hours_before_partial_refund" INTEGER NOT NULL DEFAULT 1,
    "payout_delay_days" INTEGER NOT NULL DEFAULT 2,
    "is_payout_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerBillingConfig_pkey" PRIMARY KEY ("partner_uid")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "infrastructure"."Partner_settings" (
    "uid" TEXT NOT NULL,
    "partner_uid" TEXT NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "days_before_refund_expiration" INTEGER NOT NULL DEFAULT 2,
    "stripe_account_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_settings_pkey" PRIMARY KEY ("uid")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payments_stripe_payment_intent_id_key" ON "billing"."Payments"("stripe_payment_intent_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payments_stripe_charge_id_key" ON "billing"."Payments"("stripe_charge_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payments_stripe_transfer_id_key" ON "billing"."Payments"("stripe_transfer_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Payments_idempotency_key_key" ON "billing"."Payments"("idempotency_key");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payments_session_uid_idx" ON "billing"."Payments"("session_uid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payments_user_uid_idx" ON "billing"."Payments"("user_uid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payments_partner_uid_idx" ON "billing"."Payments"("partner_uid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payments_status_idx" ON "billing"."Payments"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payments_created_at_idx" ON "billing"."Payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Refunds_stripe_refund_id_key" ON "billing"."Refunds"("stripe_refund_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Refunds_payment_uid_idx" ON "billing"."Refunds"("payment_uid");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Stripe_events_type_idx" ON "billing"."Stripe_events"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Stripe_events_status_idx" ON "billing"."Stripe_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerBillingConfig_stripe_account_id_key" ON "billing"."PartnerBillingConfig"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Partner_settings_partner_uid_key" ON "infrastructure"."Partner_settings"("partner_uid");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Partner_settings_stripe_account_id_key" ON "infrastructure"."Partner_settings"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Users_stripe_customer_id_key" ON "auth"."Users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_reports_reporter_uid_reported_uid_reason_key" ON "moderation"."User_reports"("reporter_uid", "reported_uid", "reason");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "billing"."Payments" ADD CONSTRAINT "Payments_session_uid_fkey" FOREIGN KEY ("session_uid") REFERENCES "sessions"."Sessions"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "billing"."Payments" ADD CONSTRAINT "Payments_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "billing"."Payments" ADD CONSTRAINT "Payments_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "billing"."Refunds" ADD CONSTRAINT "Refunds_payment_uid_fkey" FOREIGN KEY ("payment_uid") REFERENCES "billing"."Payments"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "billing"."PartnerBillingConfig" ADD CONSTRAINT "PartnerBillingConfig_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "infrastructure"."Partner_settings" ADD CONSTRAINT "Partner_settings_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
