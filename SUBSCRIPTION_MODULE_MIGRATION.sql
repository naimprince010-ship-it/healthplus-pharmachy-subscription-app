

DROP TABLE IF EXISTS "SubscriptionItem" CASCADE;
DROP TABLE IF EXISTS "Subscription" CASCADE;
DROP TABLE IF EXISTS "SubscriptionPlan" CASCADE;

CREATE TABLE "SubscriptionPlan" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "shortDescription" TEXT,
  "itemsSummary" TEXT,
  "itemsJson" JSONB,
  "priceMonthly" INTEGER NOT NULL,
  "bannerImageUrl" TEXT,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Subscription" (
  "id" SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "planId" INTEGER NOT NULL,
  "pricePerPeriod" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextDelivery" TIMESTAMP(3) NOT NULL,
  "address" TEXT NOT NULL,
  "zoneId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Subscription_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_zoneId_idx" ON "Subscription"("zoneId");
CREATE INDEX "SubscriptionPlan_slug_idx" ON "SubscriptionPlan"("slug");
CREATE INDEX "SubscriptionPlan_isActive_idx" ON "SubscriptionPlan"("isActive");
CREATE INDEX "SubscriptionPlan_sortOrder_idx" ON "SubscriptionPlan"("sortOrder");

INSERT INTO "SubscriptionPlan" ("name", "slug", "shortDescription", "itemsSummary", "priceMonthly", "isFeatured", "isActive", "sortOrder")
VALUES 
  (
    'Family Pack',
    'family-pack',
    'Comprehensive family health package with essential medicines for all ages.',
    E'Essential medicines for common ailments\nVitamins and supplements\nFirst aid supplies\nPain relief medications\nCold and flu remedies',
    3500,
    true,
    true,
    1
  ),
  (
    'Baby Care Package',
    'baby-care-package',
    'Essential baby care medicines and supplements for healthy growth.',
    E'Baby vitamins and supplements\nGripe water and colic relief\nFever and pain relief (infant-safe)\nSkin care products\nDigestive health supplements',
    1200,
    false,
    true,
    2
  ),
  (
    'BP Care Package',
    'bp-care-package',
    'Monthly blood pressure management package with essential medicines.',
    E'Blood pressure medications\nCardiovascular supplements\nCholesterol management\nBlood thinners (as prescribed)\nRegular monitoring supplies',
    1500,
    false,
    true,
    3
  ),
  (
    'Diabetes Care Package',
    'diabetes-care-package',
    'Complete diabetes management package with medicines and supplements.',
    E'Diabetes medications\nBlood sugar monitoring supplies\nInsulin (if prescribed)\nDiabetic supplements\nFoot care products',
    2000,
    true,
    true,
    4
  )
ON CONFLICT ("slug") 
DO UPDATE SET
  "name" = EXCLUDED."name",
  "shortDescription" = EXCLUDED."shortDescription",
  "itemsSummary" = EXCLUDED."itemsSummary",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "isFeatured" = EXCLUDED."isFeatured",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;
