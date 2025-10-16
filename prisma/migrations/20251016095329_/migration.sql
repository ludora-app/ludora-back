/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Partners` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Partners` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "auth"."User_type" ADD VALUE 'PARTNER';

-- CreateIndex
CREATE UNIQUE INDEX "Partners_name_key" ON "infrastructure"."Partners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Partners_email_key" ON "infrastructure"."Partners"("email");
