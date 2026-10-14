import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function GET() {
    const authResult = await requireAdmin()
    if (!authResult.authorized) return authResult.response

    try {
        const products = await prisma.product.findMany({
            where: {
                type: 'GENERAL',
                category: {
                    name: { contains: 'Tablet', mode: 'insensitive' }
                }
            },
            select: {
                id: true,
                name: true,
                type: true,
                category: { select: { name: true } },
                medicine: { select: { genericName: true } }
            }
        })

        return NextResponse.json({ count: products.length, products })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
