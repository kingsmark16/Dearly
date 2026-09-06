ALTER TABLE "letter" ADD COLUMN "publishedContent" JSONB;

UPDATE "letter"
SET "publishedContent" = "content"
WHERE "status" = 'PUBLISHED';
