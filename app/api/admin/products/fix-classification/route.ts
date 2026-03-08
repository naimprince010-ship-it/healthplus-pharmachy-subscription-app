import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Keywords that strongly suggest a product is a medicine
        const medicineKeywords = [
            'Tablet', 'Capsule', 'Syrup', 'Injection', 'Suspension',
            'Ointment', 'Cream', 'Gel', 'Drops', 'Inhaler', 'Spray',
            'Solution', 'Infusion', 'Cream', 'Lotion', 'Powder'
        ]

        // 1. Find categories that should be marked as medicine categories
        const medicineCategories = await prisma.category.findMany({
            where: {
                OR: medicineKeywords.map(keyword => ({
                    name: { contains: keyword, mode: 'insensitive' }
                }))
            }
        })

        const medicineCategoryIds = medicineCategories.map(c => c.id)

        // 2. Mark these categories as medicine categories
        if (medicineCategoryIds.length > 0) {
            await prisma.category.updateMany({
                where: { id: { in: medicineCategoryIds } },
                data: { isMedicineCategory: true }
            })
        }

        // 3. Find products that are currently GENERAL but belong to these categories
        const misclassifiedProducts = await prisma.product.findMany({
            where: {
                type: 'GENERAL',
                categoryId: { in: medicineCategoryIds }
            },
            include: {
                medicine: true
            }
        })

        let fixedCount = 0
        let medicineCreatedCount = 0

        // Use a transaction to fix them in batches
        const BATCH_SIZE = 50
        for (let i = 0; i < misclassifiedProducts.length; i += BATCH_SIZE) {
            const batch = misclassifiedProducts.slice(i, i + BATCH_SIZE)

            await prisma.$transaction(async (tx) => {
                for (const product of batch) {
                    // Update product type
                    await tx.product.update({
                        where: { id: product.id },
                        data: { type: 'MEDICINE' }
                    })

                    // Create medicine record if missing
                    if (!product.medicine) {
                        await tx.medicine.create({
                            data: {
                                productId: product.id,
                                name: product.name,
                                slug: product.slug,
                                brandName: product.brandName,
                                manufacturer: product.brandName || 'Unknown',
                                categoryId: product.categoryId,
                                mrp: product.mrp,
                                sellingPrice: product.sellingPrice,
                                price: product.sellingPrice,
                                stockQuantity: product.stockQuantity,
                                imageUrl: product.imageUrl,
                                description: product.description,
                                isActive: product.isActive
                            }
                        })
                        medicineCreatedCount++
                    }
                    fixedCount++
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: `Successfully reclassified ${fixedCount} products to MEDICINE.`,
            fixedCount,
            medicineCreatedCount,
            updatedCategories: medicineCategories.map(c => c.name)
        })
    } catch (error: any) {
        console.error('Classification fix error:', error)
        return NextResponse.json(
            { error: `Fix failed: ${error.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
