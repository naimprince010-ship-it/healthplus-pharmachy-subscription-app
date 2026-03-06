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

                // If the slug changed or we just want to be sure it's unique
                // We must ensure it doesn't collide with:
                // 1. Slugs already in DB (except our own current slug if we are not changing name)
                // 2. Slugs we just assigned to other products in this loop

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

                updates.push(
                    prisma.product.update({
                        where: { id: product.id },
                        data: {
                            name: cleanedName,
                            slug: newSlug
                        }
                    })
                )

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
            } else {
                // If name didn't change, still add its slug to used set to prevent others from taking it
                sessionUsedSlugs.add(product.slug)
            }
        }

        // Execute all updates in batches to avoid transaction timeouts
        const BATCH_SIZE = 50
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
            const batch = updates.slice(i, i + BATCH_SIZE)
            await prisma.$transaction(batch, {
                timeout: 30000 // 30 seconds per batch
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
