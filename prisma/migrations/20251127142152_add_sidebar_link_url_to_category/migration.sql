-- Add sidebarLinkUrl field to Category table
-- This allows admins to set a custom link URL for sidebar items (e.g., /sections/women-s-choice)

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "sidebarLinkUrl" TEXT;
