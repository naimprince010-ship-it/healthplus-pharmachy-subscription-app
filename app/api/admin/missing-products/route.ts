import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    const search = searchParams.get('search')

    const where: {
      isResolved?: boolean
      name?: { contains: string; mode: 'insensitive' }
    } = {}

    if (resolved === 'true') {
      where.isResolved = true
    } else if (resolved === 'false') {
      where.isResolved = false
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const missingProducts = await prisma.missingProduct.findMany({
      where,
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ missingProducts })
  } catch (error) {
    console.error('Error fetching missing products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch missing products' },
      { status: 500 }
    )
  }
}
