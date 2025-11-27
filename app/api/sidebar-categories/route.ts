import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        showInSidebar: true,
        isActive: true,
      },
      orderBy: {
        sidebarOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sidebarIconUrl: true,
        sidebarLinkUrl: true,
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching sidebar categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sidebar categories' },
      { status: 500 }
    )
  }
}
