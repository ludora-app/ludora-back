-- AlterTable
ALTER TABLE "auth"."Users" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'FR';
