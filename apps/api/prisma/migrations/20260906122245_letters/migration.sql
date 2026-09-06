-- CreateEnum
CREATE TYPE "LetterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'TRASHED');

-- CreateTable
CREATE TABLE "letter" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "status" "LetterStatus" NOT NULL DEFAULT 'DRAFT',
    "templateSlug" VARCHAR(120) NOT NULL,
    "templateVersion" INTEGER NOT NULL,
    "templateSnapshot" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "shareToken" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "letter_shareToken_key" ON "letter"("shareToken");

-- CreateIndex
CREATE INDEX "letter_creatorId_status_updatedAt_idx" ON "letter"("creatorId", "status", "updatedAt");

-- AddForeignKey
ALTER TABLE "letter" ADD CONSTRAINT "letter_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
