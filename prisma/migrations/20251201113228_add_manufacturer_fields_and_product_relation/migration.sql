-- Add new fields to Manufacturer table
ALTER TABLE "Manufacturer" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Manufacturer" ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT;
ALTER TABLE "Manufacturer" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add manufacturerId to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "manufacturerId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Product" ADD CONSTRAINT "Product_manufacturerId_fkey" 
  FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for manufacturerId
CREATE INDEX IF NOT EXISTS "Product_manufacturerId_idx" ON "Product"("manufacturerId");
