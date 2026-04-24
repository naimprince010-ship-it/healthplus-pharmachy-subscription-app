-- Category mapping for Azan supplier imports
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sourceCategoryName" TEXT;

CREATE TABLE IF NOT EXISTS "AzanCategoryMapping" (
  "id" TEXT NOT NULL,
  "sourceCategoryKey" TEXT NOT NULL,
  "sourceCategoryLabel" TEXT,
  "localCategoryId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AzanCategoryMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AzanCategoryMapping_sourceCategoryKey_key"
  ON "AzanCategoryMapping"("sourceCategoryKey");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AzanCategoryMapping_localCategoryId_fkey'
  ) THEN
    ALTER TABLE "AzanCategoryMapping"
      ADD CONSTRAINT "AzanCategoryMapping_localCategoryId_fkey"
      FOREIGN KEY ("localCategoryId") REFERENCES "Category"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
