
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "dosageForm" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "packSize" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "mrp" DOUBLE PRECISION;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "sellingPrice" DOUBLE PRECISION;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "minStockAlert" INTEGER;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

UPDATE "Medicine" 
SET "sellingPrice" = COALESCE("price", 0)
WHERE "sellingPrice" IS NULL;

UPDATE "Medicine" 
SET "brandName" = "manufacturer"
WHERE "brandName" IS NULL AND "manufacturer" IS NOT NULL;

UPDATE "Medicine" 
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) || '-' || SUBSTRING("id", 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "Medicine" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Medicine_slug_key" ON "Medicine"("slug");

ALTER TABLE "Medicine" ALTER COLUMN "sellingPrice" SET NOT NULL;
