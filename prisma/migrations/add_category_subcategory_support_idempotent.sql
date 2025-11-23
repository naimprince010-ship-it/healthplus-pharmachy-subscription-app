
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Category' AND column_name = 'parentCategoryId'
  ) THEN
    ALTER TABLE "Category" ADD COLUMN "parentCategoryId" TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Category' AND column_name = 'sortOrder'
  ) THEN
    ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'Category' AND constraint_name = 'Category_parentCategoryId_fkey'
  ) THEN
    ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey"
      FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");
