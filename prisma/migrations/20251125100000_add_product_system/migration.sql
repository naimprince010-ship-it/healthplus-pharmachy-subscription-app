-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MEDICINE', 'GENERAL');

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "imagePath" TEXT,
    "mrp" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "brandName" TEXT,
    "sizeLabel" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "variantLabel" TEXT,
    "keyFeatures" TEXT,
    "specSummary" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "canonicalUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "excludeFromMembershipDiscount" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "sizeLabel" TEXT,
    "sku" TEXT,
    "mrp" DOUBLE PRECISION,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Medicine" ADD COLUMN "productId" TEXT;

ALTER TABLE "OrderItem" ADD COLUMN "productId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productType" TEXT;

ALTER TABLE "OrderItem" ALTER COLUMN "medicineId" DROP NOT NULL;


-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_type_idx" ON "Product"("type");
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");
CREATE INDEX "Product_slug_idx" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_variantName_key" ON "ProductVariant"("productId", "variantName");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex for Medicine.productId (unique, optional)
CREATE UNIQUE INDEX "Medicine_productId_key" ON "Medicine"("productId") WHERE "productId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (Medicine -> Product, optional during Phase 1)
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey (OrderItem -> Product, will be used in Phase 2)
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
