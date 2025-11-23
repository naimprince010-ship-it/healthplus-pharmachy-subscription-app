-- 
--

ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0;
ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "deliveryFee" INT;

UPDATE "Zone" 
SET "deliveryFee" = ROUND("deliveryCharge")::INT 
WHERE "deliveryFee" IS NULL AND "deliveryCharge" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Zone_isActive_idx" ON "Zone"("isActive");
CREATE INDEX IF NOT EXISTS "Zone_sortOrder_idx" ON "Zone"("sortOrder");

INSERT INTO "Zone" ("id", "name", "description", "deliveryFee", "deliveryCharge", "deliveryDays", "isActive", "sortOrder", "createdAt", "updatedAt")
VALUES 
  (
    'zone_shariatpur_sadar',
    'Shariatpur Sadar',
    'Palong, Goshairhat Road, Hospital Area, Chikondi, Tarabunia',
    40,
    40.0,
    '1-2 days',
    true,
    1,
    NOW(),
    NOW()
  ),
  (
    'zone_naria',
    'Naria',
    'Naria Bazar, Sureswar, Gharisar',
    50,
    50.0,
    '1-2 days',
    true,
    2,
    NOW(),
    NOW()
  ),
  (
    'zone_jajira',
    'Jajira',
    'Jajira, Purba Naodoba, Bhedorganj',
    50,
    50.0,
    '2-3 days',
    true,
    3,
    NOW(),
    NOW()
  ),
  (
    'zone_damudya',
    'Damudya',
    'Damudya Bazar Area',
    60,
    60.0,
    '2-3 days',
    true,
    4,
    NOW(),
    NOW()
  ),
  (
    'zone_outside_shariatpur',
    'Outside Shariatpur',
    'Nearby areas outside district',
    70,
    70.0,
    '3-5 days',
    true,
    5,
    NOW(),
    NOW()
  )
ON CONFLICT ("name") 
DO UPDATE SET
  "description" = EXCLUDED."description",
  "deliveryFee" = EXCLUDED."deliveryFee",
  "deliveryCharge" = EXCLUDED."deliveryCharge",
  "deliveryDays" = EXCLUDED."deliveryDays",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "zoneId" TEXT;

UPDATE "Order" o
SET "zoneId" = a."zoneId"
FROM "Address" a
WHERE a."id" = o."addressId" 
  AND o."zoneId" IS NULL;

UPDATE "Order"
SET "zoneId" = (SELECT "id" FROM "Zone" WHERE "isActive" = true ORDER BY "sortOrder" LIMIT 1)
WHERE "zoneId" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "zoneId" SET NOT NULL;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Order_zoneId_fkey'
  ) THEN
    ALTER TABLE "Order" 
    ADD CONSTRAINT "Order_zoneId_fkey" 
    FOREIGN KEY ("zoneId") REFERENCES "Zone"("id");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Order_zoneId_idx" ON "Order"("zoneId");
