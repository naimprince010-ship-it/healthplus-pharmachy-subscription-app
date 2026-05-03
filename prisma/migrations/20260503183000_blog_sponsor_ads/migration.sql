-- CreateEnum
CREATE TYPE "BlogSponsorPlacement" AS ENUM ('BLOG_LIST_TOP', 'BLOG_ARTICLE_SIDEBAR_TOP');

-- CreateTable
CREATE TABLE "BlogSponsorAd" (
    "id" TEXT NOT NULL,
    "sponsorLabel" TEXT NOT NULL,
    "imageUrl" TEXT,
    "headline" TEXT,
    "targetUrl" TEXT NOT NULL,
    "placement" "BlogSponsorPlacement" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogSponsorAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogSponsorAd_placement_isActive_idx" ON "BlogSponsorAd"("placement", "isActive");

-- CreateIndex
CREATE INDEX "BlogSponsorAd_startAt_endAt_idx" ON "BlogSponsorAd"("startAt", "endAt");
