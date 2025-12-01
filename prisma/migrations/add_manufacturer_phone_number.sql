-- Add phoneNumber field to Manufacturer table
ALTER TABLE "Manufacturer" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
