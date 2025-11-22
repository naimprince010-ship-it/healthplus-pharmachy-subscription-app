
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
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMPTZ;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

UPDATE "Medicine"
SET "sellingPrice" = COALESCE("sellingPrice", COALESCE("price", 0))
WHERE "sellingPrice" IS NULL;

UPDATE "Medicine"
SET "brandName" = COALESCE("brandName", "manufacturer")
WHERE "brandName" IS NULL;

WITH base AS (
  SELECT id,
         LOWER(
           REGEXP_REPLACE(
             REGEXP_REPLACE(TRIM(name), '[^\w\s-]', '', 'g'),
             '[\s_-]+', '-', 'g'
           )
         ) AS base_slug
  FROM "Medicine"
  WHERE ("slug" IS NULL OR "slug" = '')
),
dedup AS (
  SELECT id,
         base_slug,
         base_slug || CASE WHEN rn = 1 THEN '' ELSE '-' || rn::TEXT END AS new_slug
  FROM (
    SELECT id,
           base_slug,
           ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
    FROM base
  ) s
)
UPDATE "Medicine" m
SET "slug" = d.new_slug
FROM dedup d
WHERE m.id = d.id;

ALTER TABLE "Medicine" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Medicine" ALTER COLUMN "sellingPrice" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'Medicine_slug_key'
  ) THEN
    CREATE UNIQUE INDEX "Medicine_slug_key" ON "Medicine" ("slug");
  END IF;
END $$;

SELECT 
  COUNT(*) as total_medicines,
  COUNT("slug") as medicines_with_slug,
  COUNT("sellingPrice") as medicines_with_price,
  COUNT(CASE WHEN "slug" IS NOT NULL AND "sellingPrice" IS NOT NULL THEN 1 END) as ready_for_crud
FROM "Medicine";
