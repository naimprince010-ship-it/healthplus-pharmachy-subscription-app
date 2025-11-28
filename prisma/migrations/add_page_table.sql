-- Migration: Add Page table and PageGroup enum for admin-configurable footer pages
-- Run this SQL on your Supabase database after merging PR #135

-- Create the PageGroup enum
CREATE TYPE "PageGroup" AS ENUM ('QUICK_LINKS', 'SUPPORT', 'NONE');

-- Create the Page table
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "group" "PageGroup" NOT NULL DEFAULT 'SUPPORT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- Create composite index for efficient footer queries
CREATE INDEX "Page_group_isPublished_sortOrder_idx" ON "Page"("group", "isPublished", "sortOrder");
