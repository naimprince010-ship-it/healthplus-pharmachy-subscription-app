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
        const updateTasks = []

        // Track slugs used during THIS cleanup session to avoid internal collisions
        const sessionUsedSlugs = new Set<string>()

        // Fetch all existing slugs to avoid external collisions
        const existingSlugsList = await prisma.product.findMany({
            select: { slug: true }
        })
        const dbSlugs = new Set(existingSlugsList.map(p => p.slug))

        for (const product of products) {
            const originalName = product.name
            // Clean ALL trailing pack sizes to get the base name
            const baseName = cleanProductName(originalName)

            // Re-append the canonical pack size if it exists, to ensure it shows once
            const cleanedName = product.sizeLabel
                ? `${baseName} ${product.sizeLabel}`
                : baseName

            if (cleanedName !== originalName) {
                // Generate a unique slug
                let newSlug = slugify(cleanedName)
                const baseSlug = newSlug

                let counter = 1
                while (
                    (dbSlugs.has(newSlug) && newSlug !== product.slug) ||
                    sessionUsedSlugs.has(newSlug)
                ) {
                    newSlug = `${baseSlug}-${counter}`
                    counter++
                }

                sessionUsedSlugs.add(newSlug)
                dbSlugs.add(newSlug)

                updateTasks.push({
                    productId: product.id,
                    medicineId: product.medicine?.id,
                    data: {
                        name: cleanedName,
                        slug: newSlug
                    }
                })

                fixedCount++
            } else {
                sessionUsedSlugs.add(product.slug)
            }
        }

        // Execute all updates in batches to avoid transaction timeouts
        const BATCH_SIZE = 50
        for (let i = 0; i < updateTasks.length; i += BATCH_SIZE) {
            const batch = updateTasks.slice(i, i + BATCH_SIZE)

            await prisma.$transaction(async (tx) => {
                for (const task of batch) {
                    await tx.product.update({
                        where: { id: task.productId },
                        data: task.data
                    })

                    if (task.medicineId) {
                        await tx.medicine.update({
                            where: { id: task.medicineId },
                            data: task.data
                        })
                    }
                }
            }, {
                timeout: 30000 // 30 seconds for 50 updates
            })
        }

        return NextResponse.json({
            success: true,
            message: `Successfully cleaned up names for ${fixedCount} products.`,
            fixedCount
        })
    } catch (error: any) {
        console.error('Product cleanup error:', error)
        return NextResponse.json(
            { error: `Cleanup failed: ${error.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
