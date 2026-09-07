CREATE TABLE "letter_report" (
    "id" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "reason" VARCHAR(64) NOT NULL,
    "details" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "letter_report_letterId_createdAt_idx" ON "letter_report"("letterId", "createdAt");

ALTER TABLE "letter_report" ADD CONSTRAINT "letter_report_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
