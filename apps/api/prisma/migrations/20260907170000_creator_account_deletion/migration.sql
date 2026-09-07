ALTER TABLE "user" ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);

CREATE INDEX "user_deletionRequestedAt_idx" ON "user"("deletionRequestedAt");
