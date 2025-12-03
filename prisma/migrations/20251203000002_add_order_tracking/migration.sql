-- Add rider info and estimated delivery fields to Order table
ALTER TABLE "Order" ADD COLUMN "riderName" TEXT;
ALTER TABLE "Order" ADD COLUMN "riderPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "estimatedDeliveryAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "estimatedDeliveryText" TEXT;

-- Create OrderStatusHistory table for tracking status changes with timestamps
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes for OrderStatusHistory
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
CREATE INDEX "OrderStatusHistory_orderId_changedAt_idx" ON "OrderStatusHistory"("orderId", "changedAt");

-- Add foreign key constraint
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create OrderTrackingSettings table (singleton for admin-configurable text)
CREATE TABLE "OrderTrackingSettings" (
    "id" TEXT NOT NULL,
    "headerTitlePrefixBn" TEXT NOT NULL DEFAULT 'অর্ডার',
    "statusSectionTitleBn" TEXT NOT NULL DEFAULT 'স্ট্যাটাস',
    "deliverySectionTitleBn" TEXT NOT NULL DEFAULT 'ডেলিভারি ঠিকানা',
    "itemsSectionTitleBn" TEXT NOT NULL DEFAULT 'আইটেমস',
    "totalLabelBn" TEXT NOT NULL DEFAULT 'সর্বমোট:',
    "placedLabelBn" TEXT NOT NULL DEFAULT 'অর্ডার প্লেসড',
    "confirmedLabelBn" TEXT NOT NULL DEFAULT 'কনফার্মড',
    "processingLabelBn" TEXT NOT NULL DEFAULT 'প্রসেসিং',
    "shippedLabelBn" TEXT NOT NULL DEFAULT 'শিপড/অন দ্য ওয়ে',
    "deliveredLabelBn" TEXT NOT NULL DEFAULT 'ডেলিভারড',
    "cancelledLabelBn" TEXT NOT NULL DEFAULT 'বাতিল',
    "riderLabelBn" TEXT NOT NULL DEFAULT 'রাইডার:',
    "callButtonBn" TEXT NOT NULL DEFAULT 'Call',
    "estimatedDeliveryLabelBn" TEXT NOT NULL DEFAULT 'আনুমানিক সময়:',
    "supportTextBn" TEXT NOT NULL DEFAULT 'সাহায্য প্রয়োজন?',
    "supportLinkTextBn" TEXT NOT NULL DEFAULT 'কল করুন',
    "supportPhone" TEXT NOT NULL DEFAULT '01700000000',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTrackingSettings_pkey" PRIMARY KEY ("id")
);
