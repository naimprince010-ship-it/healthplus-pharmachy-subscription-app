
CREATE TABLE IF NOT EXISTS "PrescriptionItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "prescriptionId" TEXT NOT NULL,
  "medicineId" TEXT,
  "genericName" TEXT NOT NULL,
  "strength" TEXT,
  "quantity" INTEGER NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "PrescriptionItem_prescriptionId_fkey" 
    FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PrescriptionItem_medicineId_fkey" 
    FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "prescriptionId" TEXT UNIQUE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "membershipDiscountAmount" DOUBLE PRECISION;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "membershipPlanName" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_prescriptionId_fkey'
  ) THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_prescriptionId_fkey" 
      FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "PrescriptionItem_prescriptionId_idx" ON "PrescriptionItem"("prescriptionId");
CREATE INDEX IF NOT EXISTS "PrescriptionItem_medicineId_idx" ON "PrescriptionItem"("medicineId");
CREATE INDEX IF NOT EXISTS "Order_prescriptionId_idx" ON "Order"("prescriptionId");

UPDATE "Prescription" SET "status" = 'NEW' WHERE "status" = 'PENDING';
UPDATE "Prescription" SET "status" = 'COMPLETED' WHERE "status" = 'APPROVED';
UPDATE "Prescription" SET "status" = 'CANCELLED' WHERE "status" = 'REJECTED';
