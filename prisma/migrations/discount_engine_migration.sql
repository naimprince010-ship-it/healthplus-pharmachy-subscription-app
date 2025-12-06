-- Discount Engine Migration
-- Run this SQL on your production database to add the discount engine tables

-- Create enums
DO $$ BEGIN
    CREATE TYPE "DiscountRuleType" AS ENUM ('CATEGORY', 'BRAND', 'CART_AMOUNT', 'USER_GROUP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add campaign price fields to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignPrice" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignStart" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignEnd" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "campaignRuleId" TEXT;

-- Create DiscountRule table
CREATE TABLE IF NOT EXISTS "DiscountRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" "DiscountRuleType" NOT NULL,
    "targetValue" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "minCartAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountRule_pkey" PRIMARY KEY ("id")
);

-- Create Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "minCartAmount" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "perUserLimit" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- Create CouponUsage table
CREATE TABLE IF NOT EXISTS "CouponUsage" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "discount" DOUBLE PRECISION NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponUsage_pkey" PRIMARY KEY ("id")
);

-- Create DiscountLog table
CREATE TABLE IF NOT EXISTS "DiscountLog" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "productId" TEXT NOT NULL,
    "oldPrice" DOUBLE PRECISION NOT NULL,
    "newPrice" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountLog_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on Coupon.code
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");

-- Create indexes for DiscountRule
CREATE INDEX IF NOT EXISTS "DiscountRule_isActive_startDate_endDate_idx" ON "DiscountRule"("isActive", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "DiscountRule_ruleType_idx" ON "DiscountRule"("ruleType");
CREATE INDEX IF NOT EXISTS "DiscountRule_priority_idx" ON "DiscountRule"("priority");

-- Create indexes for Coupon
CREATE INDEX IF NOT EXISTS "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_startDate_endDate_idx" ON "Coupon"("isActive", "startDate", "endDate");

-- Create indexes for CouponUsage
CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");
CREATE INDEX IF NOT EXISTS "CouponUsage_userId_idx" ON "CouponUsage"("userId");
CREATE INDEX IF NOT EXISTS "CouponUsage_couponId_userId_idx" ON "CouponUsage"("couponId", "userId");

-- Create indexes for DiscountLog
CREATE INDEX IF NOT EXISTS "DiscountLog_ruleId_idx" ON "DiscountLog"("ruleId");
CREATE INDEX IF NOT EXISTS "DiscountLog_productId_idx" ON "DiscountLog"("productId");
CREATE INDEX IF NOT EXISTS "DiscountLog_appliedAt_idx" ON "DiscountLog"("appliedAt");

-- Add foreign key constraints
ALTER TABLE "CouponUsage" DROP CONSTRAINT IF EXISTS "CouponUsage_couponId_fkey";
ALTER TABLE "CouponUsage" ADD CONSTRAINT "CouponUsage_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscountLog" DROP CONSTRAINT IF EXISTS "DiscountLog_ruleId_fkey";
ALTER TABLE "DiscountLog" ADD CONSTRAINT "DiscountLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "DiscountRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
