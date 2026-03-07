import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
