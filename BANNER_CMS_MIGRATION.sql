
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "imageDesktopUrl" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "imageMobileUrl" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "ctaLabel" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "ctaUrl" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "bgColor" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "textColor" TEXT;
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "startAt" TIMESTAMP(3);
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "endAt" TIMESTAMP(3);
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "visibilityDevice" TEXT NOT NULL DEFAULT 'all';

UPDATE "Banner" SET "imageDesktopUrl" = "imageUrl" WHERE "imageUrl" IS NOT NULL AND "imageDesktopUrl" IS NULL;

UPDATE "Banner" SET "ctaUrl" = "link" WHERE "link" IS NOT NULL AND "ctaUrl" IS NULL;

COMMENT ON COLUMN "Banner"."subtitle" IS 'Optional subtitle for the banner';
COMMENT ON COLUMN "Banner"."imageDesktopUrl" IS 'Desktop-specific banner image URL';
COMMENT ON COLUMN "Banner"."imageMobileUrl" IS 'Mobile-specific banner image URL';
COMMENT ON COLUMN "Banner"."ctaLabel" IS 'Call-to-action button label';
COMMENT ON COLUMN "Banner"."ctaUrl" IS 'Call-to-action URL';
COMMENT ON COLUMN "Banner"."bgColor" IS 'Background color (hex or CSS color)';
COMMENT ON COLUMN "Banner"."textColor" IS 'Text color (hex or CSS color)';
COMMENT ON COLUMN "Banner"."startAt" IS 'Schedule start date/time (nullable for always active)';
COMMENT ON COLUMN "Banner"."endAt" IS 'Schedule end date/time (nullable for no end)';
COMMENT ON COLUMN "Banner"."visibilityDevice" IS 'Device visibility: all, desktop, or mobile';
