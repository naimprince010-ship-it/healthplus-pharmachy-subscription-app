-- Azan dropship: supplier barcode on product; order forward tracking
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierSku" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "azanPushedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "azanPushError" TEXT;
