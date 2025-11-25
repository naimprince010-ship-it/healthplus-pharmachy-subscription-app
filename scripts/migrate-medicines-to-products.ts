/**
 * Migration Script: Migrate Medicines to Product System
 * 
 * This script:
 * 1. Creates Product records from existing Medicine records
 * 2. Links Medicine.productId to the new Product
 * 3. Backfills OrderItem.productId from medicineId
 * 4. Validates the migration
 * 
 * Run with: npx tsx scripts/migrate-medicines-to-products.ts
 */

import { PrismaClient, ProductType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting Medicine → Product migration...\n')

  const medicineCount = await prisma.medicine.count()
  console.log(`📊 Found ${medicineCount} medicines to migrate\n`)

  if (medicineCount === 0) {
    console.log('✅ No medicines to migrate. Exiting.')
    return
  }

  console.log('📥 Fetching all medicines...')
  const medicines = await prisma.medicine.findMany({
    include: {
      category: true,
    },
  })
  console.log(`✅ Fetched ${medicines.length} medicines\n`)

  console.log('🔨 Creating Product records...')
  let createdCount = 0
  let skippedCount = 0
  const errors: Array<{ medicineId: string; error: string }> = []

  for (const medicine of medicines) {
    try {
      const existingProduct = await prisma.product.findFirst({
        where: {
          slug: medicine.slug,
        },
      })

      if (existingProduct) {
        console.log(`⚠️  Product already exists for medicine: ${medicine.name} (${medicine.slug})`)
        skippedCount++
        continue
      }

      const product = await prisma.product.create({
        data: {
          type: ProductType.MEDICINE,
          name: medicine.name,
          slug: medicine.slug,
          description: medicine.description,
          imageUrl: medicine.imageUrl,
          imagePath: medicine.imagePath,
          mrp: medicine.mrp,
          sellingPrice: medicine.sellingPrice || medicine.price, // Fallback to deprecated price field
          stockQuantity: medicine.stockQuantity,
          minStockAlert: medicine.minStockAlert,
          inStock: medicine.inStock,
          brandName: medicine.brandName,
          unit: medicine.unit,
          seoTitle: medicine.seoTitle,
          seoDescription: medicine.seoDescription,
          seoKeywords: medicine.seoKeywords,
          canonicalUrl: medicine.canonicalUrl,
          isFeatured: medicine.isFeatured,
          categoryId: medicine.categoryId,
          isActive: medicine.isActive,
          deletedAt: medicine.deletedAt,
          excludeFromMembershipDiscount: false, // Default for existing medicines
        },
      })

      await prisma.medicine.update({
        where: { id: medicine.id },
        data: { productId: product.id },
      })

      createdCount++
      if (createdCount % 10 === 0) {
        console.log(`   Created ${createdCount}/${medicines.length} products...`)
      }
    } catch (error) {
      console.error(`❌ Error creating product for medicine ${medicine.id} (${medicine.name}):`, error)
      errors.push({
        medicineId: medicine.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.log(`\n✅ Created ${createdCount} Product records`)
  console.log(`⚠️  Skipped ${skippedCount} existing products`)
  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`)
    console.log('Error details:', JSON.stringify(errors, null, 2))
  }

  console.log('\n🔗 Adding foreign key constraint to Medicine.productId...')
  try {
    await prisma.$executeRaw`
      ALTER TABLE "Medicine" 
      ALTER COLUMN "productId" SET NOT NULL;
    `
    await prisma.$executeRaw`
      ALTER TABLE "Medicine" 
      ADD CONSTRAINT "Medicine_productId_fkey" 
      FOREIGN KEY ("productId") REFERENCES "Product"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "Medicine_productId_key" ON "Medicine"("productId");
    `
    console.log('✅ Foreign key constraint added')
  } catch (error) {
    console.error('❌ Error adding foreign key constraint:', error)
    console.log('⚠️  You may need to run this SQL manually:')
    console.log(`
      ALTER TABLE "Medicine" ALTER COLUMN "productId" SET NOT NULL;
      ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      CREATE UNIQUE INDEX "Medicine_productId_key" ON "Medicine"("productId");
    `)
  }

  console.log('\n🔄 Backfilling OrderItem.productId...')
  const orderItems = await prisma.orderItem.findMany({
    where: {
      productId: null,
      medicineId: { not: null },
    },
    include: {
      medicine: {
        include: {
          product: true,
        },
      },
    },
  })

  console.log(`📊 Found ${orderItems.length} order items to update`)

  let updatedOrderItems = 0
  for (const orderItem of orderItems) {
    try {
      if (!orderItem.medicine?.product) {
        console.warn(`⚠️  OrderItem ${orderItem.id} has medicineId but no linked product`)
        continue
      }

      await prisma.orderItem.update({
        where: { id: orderItem.id },
        data: {
          productId: orderItem.medicine.product.id,
          productName: orderItem.medicine.product.name,
          productType: 'MEDICINE',
        },
      })

      updatedOrderItems++
      if (updatedOrderItems % 50 === 0) {
        console.log(`   Updated ${updatedOrderItems}/${orderItems.length} order items...`)
      }
    } catch (error) {
      console.error(`❌ Error updating order item ${orderItem.id}:`, error)
    }
  }

  console.log(`✅ Updated ${updatedOrderItems} order items\n`)

  console.log('🔍 Validating migration...')
  const productCount = await prisma.product.count()
  const medicinesWithProduct = await prisma.medicine.count({
    where: { productId: { not: null } },
  })
  const medicinesWithoutProduct = await prisma.medicine.count({
    where: { productId: null },
  })

  console.log(`\n📊 Migration Summary:`)
  console.log(`   Total Products: ${productCount}`)
  console.log(`   Medicines with Product link: ${medicinesWithProduct}`)
  console.log(`   Medicines without Product link: ${medicinesWithoutProduct}`)
  console.log(`   Order items updated: ${updatedOrderItems}`)

  if (medicinesWithoutProduct > 0) {
    console.warn(`\n⚠️  WARNING: ${medicinesWithoutProduct} medicines still don't have a product link!`)
    console.warn('   Please investigate and fix manually.')
  } else {
    console.log('\n✅ All medicines successfully migrated to Product system!')
  }

  console.log('\n🎉 Migration complete!')
}

main()
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
