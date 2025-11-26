import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillProductTypes() {
  console.log('Starting product type backfill...')

  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            isMedicineCategory: true,
          },
        },
      },
    })

    console.log(`Found ${products.length} products to process`)

    let updatedCount = 0
    let unchangedCount = 0

    for (const product of products) {
      if (!product.category) {
        console.warn(`Product ${product.id} (${product.name}) has no category, skipping`)
        continue
      }

      const expectedType = product.category.isMedicineCategory ? 'MEDICINE' : 'GENERAL'
      
      if (product.type !== expectedType) {
        console.log(
          `Updating product ${product.id} (${product.name}): ${product.type} → ${expectedType} (category: ${product.category.name})`
        )
        
        await prisma.product.update({
          where: { id: product.id },
          data: { type: expectedType },
        })
        
        updatedCount++
      } else {
        unchangedCount++
      }
    }

    console.log('\nBackfill complete!')
    console.log(`- Updated: ${updatedCount} products`)
    console.log(`- Unchanged: ${unchangedCount} products`)
    console.log(`- Total processed: ${products.length} products`)
  } catch (error) {
    console.error('Error during backfill:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillProductTypes()
  .then(() => {
    console.log('\nBackfill script finished successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nBackfill script failed:', error)
    process.exit(1)
  })
