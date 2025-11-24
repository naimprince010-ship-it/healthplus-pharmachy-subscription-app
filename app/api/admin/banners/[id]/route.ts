import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateBannerSchema } from '@/lib/validations/banner'

/**
 * GET /api/admin/banners/[id]
 * Get a single banner by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const banner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!banner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    return NextResponse.json({ banner })
  } catch (error) {
    console.error('Error fetching banner:', error)
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/banners/[id]
 * Update a banner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const data = updateBannerSchema.parse({ ...body, id })

    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.order !== undefined) updateData.order = data.order
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.imageDesktopUrl !== undefined) updateData.imageDesktopUrl = data.imageDesktopUrl
    if (data.imageMobileUrl !== undefined) updateData.imageMobileUrl = data.imageMobileUrl
    
    if (data.link !== undefined) updateData.link = data.link
    if (data.ctaLabel !== undefined) updateData.ctaLabel = data.ctaLabel
    if (data.ctaUrl !== undefined) updateData.ctaUrl = data.ctaUrl
    
    if (data.bgColor !== undefined) updateData.bgColor = data.bgColor
    if (data.textColor !== undefined) updateData.textColor = data.textColor
    
    if (data.startAt !== undefined) updateData.startAt = data.startAt
    if (data.endAt !== undefined) updateData.endAt = data.endAt
    if (data.visibilityDevice !== undefined) updateData.visibilityDevice = data.visibilityDevice

    if (data.imageDesktopUrl !== undefined || data.imageMobileUrl !== undefined) {
      updateData.imageUrl = data.imageDesktopUrl || data.imageMobileUrl || existingBanner.imageUrl
    }
    if (data.ctaUrl !== undefined) {
      updateData.link = data.ctaUrl || existingBanner.link
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ banner })
  } catch (error: any) {
    console.error('Error updating banner:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/banners/[id]
 * Delete a banner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    })

    if (!existingBanner) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    await prisma.banner.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Banner deleted successfully' })
  } catch (error) {
    console.error('Error deleting banner:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
