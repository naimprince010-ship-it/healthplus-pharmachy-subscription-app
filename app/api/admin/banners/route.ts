import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createBannerSchema, bannerListQuerySchema } from '@/lib/validations/banner'

/**
 * GET /api/admin/banners
 * List all banners with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = bannerListQuerySchema.parse({
      location: searchParams.get('location') || 'all',
      isActive: searchParams.get('isActive') || 'all',
    })

    const where: any = {}

    if (query.location !== 'all') {
      where.location = query.location
    }

    if (query.isActive !== 'all') {
      where.isActive = query.isActive === 'true'
    }

    const banners = await prisma.banner.findMany({
      where,
      orderBy: [
        { location: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Error fetching banners:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/banners
 * Create a new banner
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createBannerSchema.parse(body)

    const bannerData: any = {
      ...data,
      imageUrl: data.imageDesktopUrl || data.imageMobileUrl || data.imageUrl,
      link: data.ctaUrl || data.link || null,
    }

    const banner = await prisma.banner.create({
      data: bannerData,
    })

    return NextResponse.json({ banner }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating banner:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}
