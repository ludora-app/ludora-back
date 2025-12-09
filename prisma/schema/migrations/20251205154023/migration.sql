/*
  Warnings:

  - You are about to drop the column `status` on the `Messages` table. All the data in the column will be lost.
  - You are about to drop the `Conversation_options` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "social"."Conversation_options" DROP CONSTRAINT "Conversation_options_conversationUid_fkey";

-- DropForeignKey
ALTER TABLE "social"."Conversation_options" DROP CONSTRAINT "Conversation_options_userUid_fkey";

-- DropIndex
DROP INDEX "social"."Conversation_members_userUid_idx";

-- DropIndex
DROP INDEX "social"."Messages_conversation_uid_idx";

-- DropIndex
DROP INDEX "social"."Messages_created_at_idx";

-- AlterTable
ALTER TABLE "social"."Conversation_members" ADD COLUMN     "display_messages_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_muted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_visible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "last_read_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "social"."Conversations" ADD COLUMN     "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "social"."Messages" DROP COLUMN "status",
ADD COLUMN     "global_status" "social"."MessageStatus" NOT NULL DEFAULT 'SENT';

-- DropTable
DROP TABLE "social"."Conversation_options";

-- CreateTable
CREATE TABLE "social"."Message_receipts" (
    "message_uid" TEXT NOT NULL,
    "user_uid" TEXT NOT NULL,
    "status" "social"."MessageStatus" NOT NULL DEFAULT 'DELIVERED',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_receipts_pkey" PRIMARY KEY ("message_uid","user_uid")
);

-- CreateIndex
CREATE INDEX "Message_receipts_message_uid_idx" ON "social"."Message_receipts"("message_uid");

-- CreateIndex
CREATE INDEX "Conversation_members_userUid_is_visible_is_archived_idx" ON "social"."Conversation_members"("userUid", "is_visible", "is_archived");

-- CreateIndex
CREATE INDEX "Friends_userUid1_idx" ON "social"."Friends"("userUid1");

-- CreateIndex
CREATE INDEX "Friends_userUid2_idx" ON "social"."Friends"("userUid2");

-- CreateIndex
CREATE INDEX "Messages_conversation_uid_created_at_idx" ON "social"."Messages"("conversation_uid", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "social"."Message_receipts" ADD CONSTRAINT "Message_receipts_message_uid_fkey" FOREIGN KEY ("message_uid") REFERENCES "social"."Messages"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social"."Message_receipts" ADD CONSTRAINT "Message_receipts_user_uid_fkey" FOREIGN KEY ("user_uid") REFERENCES "auth"."Users"("uid") ON DELETE CASCADE ON UPDATE CASCADE;
