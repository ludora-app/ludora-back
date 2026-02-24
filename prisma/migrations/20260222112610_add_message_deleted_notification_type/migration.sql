-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "notifications"."notification_type" ADD VALUE 'CONVERSATION_READ';
ALTER TYPE "notifications"."notification_type" ADD VALUE 'MESSAGE_DELETED';

-- DropIndex
DROP INDEX "auth"."idx_users_firstname_trgm";

-- DropIndex
DROP INDEX "auth"."idx_users_lastname_trgm";

-- DropIndex
DROP INDEX "infrastructure"."idx_fields_name_trgm";

-- DropIndex
DROP INDEX "sessions"."idx_sessions_title_trgm";
