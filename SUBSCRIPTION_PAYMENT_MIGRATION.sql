
ALTER TABLE "Subscription" 
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'unpaid';

ALTER TABLE "Subscription" 
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'cod';

ALTER TABLE "Subscription" 
ALTER COLUMN "status" SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS "subscription_status_idx" 
ON "Subscription" ("status");

CREATE INDEX IF NOT EXISTS "subscription_payment_status_idx" 
ON "Subscription" ("paymentStatus");

SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'Subscription'
  AND column_name IN ('status', 'paymentStatus', 'paymentMethod')
ORDER BY column_name;
