ALTER TABLE "Category" ADD COLUMN "parentCategoryId" TEXT;
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentCategoryId_fkey" 
  FOREIGN KEY ("parentCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Category_parentCategoryId_idx" ON "Category"("parentCategoryId");
