-- AI Product Import Wizard - Phase 2 Migration
-- Adds master tables (Generic, Manufacturer) and updates AiProductDraft with match IDs and QC fields

-- Create Generic master table
CREATE TABLE "Generic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "synonyms" JSONB,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Generic_pkey" PRIMARY KEY ("id")
);

-- Create Manufacturer master table
CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliasList" JSONB,
    "slug" TEXT NOT NULL,
    "requiresQcVerification" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- Add Phase 2 columns to AiProductDraft
ALTER TABLE "AiProductDraft" ADD COLUMN "genericMatchId" TEXT;
ALTER TABLE "AiProductDraft" ADD COLUMN "manufacturerMatchId" TEXT;
ALTER TABLE "AiProductDraft" ADD COLUMN "categoryMatchId" TEXT;
ALTER TABLE "AiProductDraft" ADD COLUMN "subcategoryMatchId" TEXT;

ALTER TABLE "AiProductDraft" ADD COLUMN "genericConfidence" DOUBLE PRECISION;
ALTER TABLE "AiProductDraft" ADD COLUMN "manufacturerConfidence" DOUBLE PRECISION;
ALTER TABLE "AiProductDraft" ADD COLUMN "categoryConfidence" DOUBLE PRECISION;

ALTER TABLE "AiProductDraft" ADD COLUMN "genericVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AiProductDraft" ADD COLUMN "manufacturerVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AiProductDraft" ADD COLUMN "categoryVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "AiProductDraft" ADD COLUMN "newGenericSuggested" TEXT;
ALTER TABLE "AiProductDraft" ADD COLUMN "newManufacturerSuggested" TEXT;

-- Create unique indexes for Generic
CREATE UNIQUE INDEX "Generic_name_key" ON "Generic"("name");
CREATE UNIQUE INDEX "Generic_slug_key" ON "Generic"("slug");
CREATE INDEX "Generic_name_idx" ON "Generic"("name");

-- Create unique indexes for Manufacturer
CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");
CREATE UNIQUE INDEX "Manufacturer_slug_key" ON "Manufacturer"("slug");
CREATE INDEX "Manufacturer_name_idx" ON "Manufacturer"("name");

-- Create indexes for AiProductDraft Phase 2 columns
CREATE INDEX "AiProductDraft_genericMatchId_idx" ON "AiProductDraft"("genericMatchId");
CREATE INDEX "AiProductDraft_manufacturerMatchId_idx" ON "AiProductDraft"("manufacturerMatchId");
CREATE INDEX "AiProductDraft_categoryMatchId_idx" ON "AiProductDraft"("categoryMatchId");

-- Add foreign key constraints
ALTER TABLE "AiProductDraft" ADD CONSTRAINT "AiProductDraft_genericMatchId_fkey" FOREIGN KEY ("genericMatchId") REFERENCES "Generic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiProductDraft" ADD CONSTRAINT "AiProductDraft_manufacturerMatchId_fkey" FOREIGN KEY ("manufacturerMatchId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiProductDraft" ADD CONSTRAINT "AiProductDraft_categoryMatchId_fkey" FOREIGN KEY ("categoryMatchId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiProductDraft" ADD CONSTRAINT "AiProductDraft_subcategoryMatchId_fkey" FOREIGN KEY ("subcategoryMatchId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
