-- Azan order store: optional supplier_product_id (their catalog id) per line; populated on catalog sync
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "supplierProductId" INTEGER;
