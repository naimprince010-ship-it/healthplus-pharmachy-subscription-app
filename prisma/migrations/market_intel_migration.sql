-- Market Intelligence - CompetitorProduct table
-- Run this SQL on your production database

CREATE TABLE IF NOT EXISTS "CompetitorProduct" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "trendScore" DOUBLE PRECISION NOT NULL,
    "productUrl" TEXT,
    "imageUrl" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorProduct_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "CompetitorProduct_siteName_category_collectedAt_idx" ON "CompetitorProduct"("siteName", "category", "collectedAt");
CREATE INDEX IF NOT EXISTS "CompetitorProduct_category_trendScore_idx" ON "CompetitorProduct"("category", "trendScore");
CREATE INDEX IF NOT EXISTS "CompetitorProduct_collectedAt_idx" ON "CompetitorProduct"("collectedAt");
