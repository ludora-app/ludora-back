/*
  Warnings:

  - Added the required column `city` to the `Fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `Fields` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Partners` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zip_code` to the `Partners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "infrastructure"."Fields" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'FR',
ADD COLUMN     "department" TEXT,
ADD COLUMN     "zip_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "infrastructure"."Partners" ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'FR',
ADD COLUMN     "department" TEXT,
ADD COLUMN     "zip_code" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Fields_city_idx" ON "infrastructure"."Fields"("city");

-- CreateIndex
CREATE INDEX "Fields_zip_code_idx" ON "infrastructure"."Fields"("zip_code");

-- CreateIndex
CREATE INDEX "Partners_city_idx" ON "infrastructure"."Partners"("city");

-- CreateIndex
CREATE INDEX "Partners_zip_code_idx" ON "infrastructure"."Partners"("zip_code");
