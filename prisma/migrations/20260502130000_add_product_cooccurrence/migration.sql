-- CreateTable
CREATE TABLE "ProductCooccurrence" (
    "id" TEXT NOT NULL,
    "anchorProductId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "coOrderCount" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCooccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCooccurrence_anchorProductId_relatedProductId_key" ON "ProductCooccurrence"("anchorProductId", "relatedProductId");

-- CreateIndex
CREATE INDEX "ProductCooccurrence_anchorProductId_coOrderCount_idx" ON "ProductCooccurrence"("anchorProductId", "coOrderCount" DESC);

-- AddForeignKey
ALTER TABLE "ProductCooccurrence" ADD CONSTRAINT "ProductCooccurrence_anchorProductId_fkey" FOREIGN KEY ("anchorProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCooccurrence" ADD CONSTRAINT "ProductCooccurrence_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
