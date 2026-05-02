-- Order-level coupon snapshot + discount amount (checkout)
ALTER TABLE "Order" ADD COLUMN "appliedCouponCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "couponDiscountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
