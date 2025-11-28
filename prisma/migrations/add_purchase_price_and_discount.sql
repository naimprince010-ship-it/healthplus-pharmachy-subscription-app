-- Add purchasePrice and discountPercentage to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "discountPercentage" DOUBLE PRECISION;

-- Add purchasePrice and discountPercentage to Medicine table
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "purchasePrice" DOUBLE PRECISION;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "discountPercentage" DOUBLE PRECISION;

-- Add discountPercentage to Category table
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "discountPercentage" DOUBLE PRECISION;
