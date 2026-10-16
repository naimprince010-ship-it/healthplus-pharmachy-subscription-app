ALTER TABLE "Order" ADD COLUMN "checkoutRequestId" TEXT;

CREATE UNIQUE INDEX "Order_userId_checkoutRequestId_key"
ON "Order"("userId", "checkoutRequestId");
