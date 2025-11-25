-- AlterTable
ALTER TABLE "infrastructure"."Fields" ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "entry_fee" DROP NOT NULL,
ALTER COLUMN "game_mode" DROP NOT NULL;
