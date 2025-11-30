-- CreateEnum
CREATE TYPE "AiImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiProductDraftStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'AI_ERROR', 'MANUALLY_EDITED');

-- CreateTable
CREATE TABLE "AiImportJob" (
    "id" TEXT NOT NULL,
    "createdByAdminId" TEXT NOT NULL,
    "csvPath" TEXT NOT NULL,
    "status" "AiImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalRows" INTEGER,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "errorSummary" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiProductDraft" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rawData" JSONB NOT NULL,
    "aiSuggestion" JSONB,
    "aiConfidence" DOUBLE PRECISION,
    "status" "AiProductDraftStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "publishedProductId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiProductDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiImportJob_status_idx" ON "AiImportJob"("status");

-- CreateIndex
CREATE INDEX "AiImportJob_createdByAdminId_idx" ON "AiImportJob"("createdByAdminId");

-- CreateIndex
CREATE INDEX "AiProductDraft_importJobId_idx" ON "AiProductDraft"("importJobId");

-- CreateIndex
CREATE INDEX "AiProductDraft_status_idx" ON "AiProductDraft"("status");

-- CreateIndex
CREATE INDEX "AiProductDraft_importJobId_status_idx" ON "AiProductDraft"("importJobId", "status");

-- AddForeignKey
ALTER TABLE "AiProductDraft" ADD CONSTRAINT "AiProductDraft_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "AiImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
