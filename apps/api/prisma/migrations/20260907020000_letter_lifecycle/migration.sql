-- CreateEnum
CREATE TYPE "LetterRestoreStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "letter"
ADD COLUMN "archivedFromStatus" "LetterRestoreStatus",
ADD COLUMN "trashedFromStatus" "LetterRestoreStatus",
ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "trashedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "letter_status_trashedAt_idx" ON "letter"("status", "trashedAt");
