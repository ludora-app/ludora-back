-- DropForeignKey
ALTER TABLE "infrastructure"."Fields" DROP CONSTRAINT "Fields_partner_uid_fkey";

-- AlterTable
ALTER TABLE "infrastructure"."Fields" ALTER COLUMN "partner_uid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "infrastructure"."Fields" ADD CONSTRAINT "Fields_partner_uid_fkey" FOREIGN KEY ("partner_uid") REFERENCES "infrastructure"."Partners"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
