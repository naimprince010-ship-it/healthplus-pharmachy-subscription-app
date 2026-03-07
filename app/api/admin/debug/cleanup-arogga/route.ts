import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session || session.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('API: Finding Arogga products without images...')

        const productsToDelete = await prisma.product.findMany({
            where: {
                AND: [
                    { imageUrl: null },
                    {
                        OR: [
                            { canonicalUrl: { contains: 'arogga' } },
                            { slug: { contains: 'arogga' } } // Backup check
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                canonicalUrl: true
            }
        })

        if (productsToDelete.length === 0) {
            return NextResponse.json({ message: 'No products found matching criteria.' })
        }

        const ids = productsToDelete.map(p => p.id)
        const count = ids.length

        // Perform deletion
        const result = await prisma.product.deleteMany({
            where: {
                id: { in: ids }
            }
        })

        return NextResponse.json({
            success: true,
            deletedCount: result.count,
            deletedProducts: productsToDelete.map(p => p.name)
        })

    } catch (error: any) {
        console.error('Cleanup API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
