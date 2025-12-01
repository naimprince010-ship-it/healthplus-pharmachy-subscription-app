-- Add new fields to ProductVariant for MedEasy-style variant display
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "unitLabel" TEXT;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "discountPercentage" DOUBLE PRECISION;
ALTER TABLE "ProductVariant" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
