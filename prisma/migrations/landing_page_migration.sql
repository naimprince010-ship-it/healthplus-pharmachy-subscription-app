-- Migration: Add LandingPage model for dynamic landing page builder
-- Run this migration manually: psql $DATABASE_URL -f prisma/migrations/landing_page_migration.sql

-- Create LandingPageStatus enum
DO $$ BEGIN
    CREATE TYPE "LandingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create LandingPage table
CREATE TABLE IF NOT EXISTS "LandingPage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "LandingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "primaryColor" TEXT DEFAULT '#036666',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "LandingPage_pkey" PRIMARY KEY ("id")
);

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS "LandingPage_slug_key" ON "LandingPage"("slug");

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS "LandingPage_status_idx" ON "LandingPage"("status");

-- Create composite index on slug and status for public page lookup
CREATE INDEX IF NOT EXISTS "LandingPage_slug_status_idx" ON "LandingPage"("slug", "status");
