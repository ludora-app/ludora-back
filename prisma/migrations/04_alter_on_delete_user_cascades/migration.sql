-- AlterTable
ALTER TABLE "infrastructure"."Fields" ADD COLUMN "creator_uid" TEXT IF NOT EXISTS;
  -- CreateIndex
  CREATE INDEX "Fields_creator_uid_idx" ON "infrastructure"."Fields"("creator_uid");

  -- AddForeignKey
  ALTER TABLE "infrastructure"."Fields" ADD CONSTRAINT "Fields_creator_uid_fkey" FOREIGN KEY ("creator_uid") REFERENCES "auth"."Users"("uid") ON DELETE SET NULL ON UPDATE CASCADE;
END IF;
