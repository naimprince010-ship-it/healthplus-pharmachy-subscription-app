ALTER TABLE "Product" ADD COLUMN     "isFlashSale" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "flashSalePrice" DOUBLE PRECISION,
ADD COLUMN     "flashSaleStart" TIMESTAMP(3),
ADD COLUMN     "flashSaleEnd" TIMESTAMP(3);
