-- Phase 3: Image handling for AI Product Import Wizard

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AiImageJobStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiImageDraftStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'PROCESSED', 'MISSING', 'MANUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add image fields to AiImportJob
ALTER TABLE "AiImportJob" ADD COLUMN IF NOT EXISTS "zipPath" TEXT;
ALTER TABLE "AiImportJob" ADD COLUMN IF NOT EXISTS "imageTotal" INTEGER;
ALTER TABLE "AiImportJob" ADD COLUMN IF NOT EXISTS "imageProcessed" INTEGER DEFAULT 0;
ALTER TABLE "AiImportJob" ADD COLUMN IF NOT EXISTS "imageStatus" "AiImageJobStatus" DEFAULT 'NONE';

-- Add image fields to AiProductDraft
ALTER TABLE "AiProductDraft" ADD COLUMN IF NOT EXISTS "imageRawFilename" TEXT;
ALTER TABLE "AiProductDraft" ADD COLUMN IF NOT EXISTS "imageMatchConfidence" DOUBLE PRECISION;
ALTER TABLE "AiProductDraft" ADD COLUMN IF NOT EXISTS "imageStatus" "AiImageDraftStatus" DEFAULT 'UNMATCHED';
ALTER TABLE "AiProductDraft" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Create index for image status
CREATE INDEX IF NOT EXISTS "AiProductDraft_imageStatus_idx" ON "AiProductDraft"("imageStatus");
