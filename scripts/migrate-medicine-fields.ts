import { prisma } from '../lib/prisma'

async function migrateMedicineFields() {
  console.log('Starting Medicine table migration...')

  try {
    await prisma.$executeRawUnsafe(`
      -- Add new columns
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "slug" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "brandName" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "dosageForm" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "packSize" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "mrp" DOUBLE PRECISION;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "sellingPrice" DOUBLE PRECISION;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "minStockAlert" INTEGER;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "seoTitle" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "seoDescription" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
      ALTER TABLE "Medicine" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
    `)
    console.log('✓ New columns added')

    await prisma.$executeRawUnsafe(`
      UPDATE "Medicine" 
      SET "sellingPrice" = COALESCE("price", 0)
      WHERE "sellingPrice" IS NULL;
    `)
    console.log('✓ Backfilled sellingPrice from price')

    await prisma.$executeRawUnsafe(`
      UPDATE "Medicine" 
      SET "brandName" = "manufacturer"
      WHERE "brandName" IS NULL AND "manufacturer" IS NOT NULL;
    `)
    console.log('✓ Backfilled brandName from manufacturer')

    await prisma.$executeRawUnsafe(`
      UPDATE "Medicine" 
      SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE("name", '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g')) || '-' || SUBSTRING("id", 1, 8)
      WHERE "slug" IS NULL;
    `)
    console.log('✓ Generated slugs for existing medicines')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Medicine" ALTER COLUMN "slug" SET NOT NULL;
    `)
    console.log('✓ Made slug NOT NULL')

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Medicine_slug_key" ON "Medicine"("slug");
    `)
    console.log('✓ Created unique index on slug')

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Medicine" ALTER COLUMN "sellingPrice" SET NOT NULL;
    `)
    console.log('✓ Made sellingPrice NOT NULL')

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateMedicineFields()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
