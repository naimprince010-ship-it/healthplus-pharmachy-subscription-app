import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cleanProductName, slugify } from '@/lib/slugify'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch all products with their optional medicine relation
        const products = await prisma.product.findMany({
            include: {
                medicine: true
            }
        })

        let fixedCount = 0

        const updates = []

        for (const product of products) {
            const originalName = product.name
            // Clean ALL trailing pack sizes to get the base name
            const baseName = cleanProductName(originalName)

            // Re-append the canonical pack size if it exists, to ensure it shows once
            const cleanedName = product.sizeLabel
                ? `${baseName} ${product.sizeLabel}`
                : baseName

            if (cleanedName !== originalName) {
                // Prepare updates for Product
                const newSlug = slugify(cleanedName)

                updates.push(
                    prisma.product.update({
                        where: { id: product.id },
                        data: {
                            name: cleanedName,
                            slug: newSlug
                        }
                    })
                )

                // If it has a medicine relation, update its name/slug too if they match
                if (product.medicine) {
                    updates.push(
                        prisma.medicine.update({
                            where: { id: product.medicine.id },
                            data: {
                                name: cleanedName,
                                slug: newSlug
                            }
                        })
                    )
                }

                fixedCount++
            }
        }

        // Execute all updates in a transaction
        if (updates.length > 0) {
            await prisma.$transaction(updates)
        }

        return NextResponse.json({
            success: true,
            message: `Successfully cleaned up names for ${fixedCount} products.`,
            fixedCount
        })
    } catch (error) {
        console.error('Product cleanup error:', error)
        return NextResponse.json(
            { error: 'Failed to clean up products' },
            { status: 500 }
        )
    }
}
