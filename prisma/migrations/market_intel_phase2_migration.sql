-- Market Intelligence Phase 2 Migration
-- Adds position, rawScoreComponents to CompetitorProduct
-- Adds MarketIntelSyncLog table

-- Add new columns to CompetitorProduct
ALTER TABLE "CompetitorProduct" ADD COLUMN IF NOT EXISTS "position" INTEGER;
ALTER TABLE "CompetitorProduct" ADD COLUMN IF NOT EXISTS "rawScoreComponents" JSONB;

-- Create MarketIntelSyncLog table
CREATE TABLE IF NOT EXISTS "MarketIntelSyncLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "siteName" TEXT,
    "totalProducts" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "MarketIntelSyncLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for MarketIntelSyncLog
CREATE INDEX IF NOT EXISTS "MarketIntelSyncLog_startedAt_idx" ON "MarketIntelSyncLog"("startedAt");
CREATE INDEX IF NOT EXISTS "MarketIntelSyncLog_status_idx" ON "MarketIntelSyncLog"("status");
