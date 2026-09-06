-- CreateEnum
CREATE TYPE "MediaAssetKind" AS ENUM ('PHOTO', 'AUDIO');

-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('PENDING', 'READY');

-- CreateTable
CREATE TABLE "media_asset" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "fieldId" VARCHAR(120) NOT NULL,
    "kind" "MediaAssetKind" NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'PENDING',
    "objectKey" VARCHAR(512) NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(128) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "durationSeconds" DOUBLE PRECISION,
    "uploadExpiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_objectKey_key" ON "media_asset"("objectKey");

-- CreateIndex
CREATE INDEX "media_asset_letterId_fieldId_status_uploadExpiresAt_idx" ON "media_asset"("letterId", "fieldId", "status", "uploadExpiresAt");

-- AddForeignKey
ALTER TABLE "media_asset" ADD CONSTRAINT "media_asset_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
