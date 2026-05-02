-- CreateEnum
CREATE TYPE "ProductInteractionKind" AS ENUM ('VIEW_ITEM', 'ADD_TO_CART');

-- CreateTable
CREATE TABLE "ProductInteractionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productId" TEXT NOT NULL,
    "kind" "ProductInteractionKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductInteractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductInteractionLog_userId_createdAt_idx" ON "ProductInteractionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductInteractionLog_productId_createdAt_idx" ON "ProductInteractionLog"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductInteractionLog_createdAt_idx" ON "ProductInteractionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ProductInteractionLog" ADD CONSTRAINT "ProductInteractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInteractionLog" ADD CONSTRAINT "ProductInteractionLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
