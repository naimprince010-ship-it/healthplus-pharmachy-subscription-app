
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "manufacturer" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "unitPrice" DOUBLE PRECISION;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "stripPrice" DOUBLE PRECISION;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "tabletsPerStrip" INTEGER;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "imagePath" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "uses" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "sideEffects" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "contraindications" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "storageInstructions" TEXT;
ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);

UPDATE "Medicine" 
SET "manufacturer" = COALESCE("brandName", 'Unknown Manufacturer')
WHERE "manufacturer" IS NULL;

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Medicine' 
    AND column_name = 'manufacturer' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "Medicine" ALTER COLUMN "manufacturer" SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Medicine_manufacturer_idx" ON "Medicine"("manufacturer");
