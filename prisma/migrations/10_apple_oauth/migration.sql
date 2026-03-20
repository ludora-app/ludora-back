
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        JOIN pg_namespace n ON t.typnamespace = n.oid 
        WHERE n.nspname = 'auth' AND t.typname = 'Provider' AND e.enumlabel = 'APPLE'
    ) THEN
        ALTER TYPE "auth"."Provider" ADD VALUE 'APPLE';
    END IF;
END $$;

ALTER TABLE "auth"."Users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "auth"."Users" ADD COLUMN IF NOT EXISTS "apple_id" VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS "Users_apple_id_key" ON "auth"."Users"("apple_id");


