-- AlterTable
ALTER TABLE "infrastructure"."Fields" ADD COLUMN IF NOT EXISTS "creator_uid" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Fields_creator_uid_idx" ON "infrastructure"."Fields"("creator_uid");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Fields_creator_uid_fkey'
      AND conrelid = '"infrastructure"."Fields"'::regclass
  ) THEN
    ALTER TABLE "infrastructure"."Fields"
      ADD CONSTRAINT "Fields_creator_uid_fkey"
      FOREIGN KEY ("creator_uid")
      REFERENCES "auth"."Users"("uid")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
