import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { prisma as db } from '../lib/prisma'

async function deleteAroggaProductsWithoutImages() {
    try {
        console.log('Finding Arogga products without images...')

        // Find products without images where the canonicalUrl contains arogga
        const productsToDelete = await (db as any).product.findMany({
            where: {
                AND: [
                    { imageUrl: null },
                    { canonicalUrl: { contains: 'arogga' } }
                ]
            },
            select: {
                id: true,
                name: true
            }
        })

        if (productsToDelete.length === 0) {
            console.log('No Arogga products without images found.')
            return
        }

        console.log(`Found ${productsToDelete.length} products to delete:`)
        productsToDelete.slice(0, 5).forEach((p: any) => console.log(`- ${p.name} (ID: ${p.id})`))
        if (productsToDelete.length > 5) {
            console.log(`...and ${productsToDelete.length - 5} more.`)
        }

        const idsToDelete = productsToDelete.map((p: any) => p.id)

        const result = await (db as any).product.deleteMany({
            where: {
                id: { in: idsToDelete }
            }
        })

        console.log(`Successfully deleted ${result.count} products.`)

    } catch (error) {
        console.error('Error deleting products:', error)
    }
}

deleteAroggaProductsWithoutImages()
