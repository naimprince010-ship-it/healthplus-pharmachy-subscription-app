import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        topic: true,
        primaryCategory: true,
        blogProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                sellingPrice: true,
                imageUrl: true,
              },
            },
          },
        },
        missingProducts: true,
      },
    })

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    return NextResponse.json({ blog })
  } catch (error) {
    console.error('Error fetching blog:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog' },
      { status: 500 }
    )
  }
}

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

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    })

    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    const updateData: {
      status?: BlogStatus
      title?: string
      summary?: string
      contentMd?: string
      contentHtml?: string
      seoTitle?: string
      seoDescription?: string
      seoKeywords?: string
      scheduledAt?: Date | null
    } = {}

    if (body.status) {
      updateData.status = body.status as BlogStatus
    }
    if (body.title !== undefined) updateData.title = body.title
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.contentMd !== undefined) updateData.contentMd = body.contentMd
    if (body.contentHtml !== undefined) updateData.contentHtml = body.contentHtml
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription
    if (body.seoKeywords !== undefined) updateData.seoKeywords = body.seoKeywords
    if (body.scheduledAt !== undefined) {
      updateData.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    }

    const blog = await prisma.blog.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ blog })
  } catch (error) {
    console.error('Error updating blog:', error)
    return NextResponse.json(
      { error: 'Failed to update blog' },
      { status: 500 }
    )
  }
}

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

    const existingBlog = await prisma.blog.findUnique({
      where: { id },
    })

    if (!existingBlog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    if (existingBlog.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot delete published blogs' },
        { status: 400 }
      )
    }

    await prisma.blog.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog' },
      { status: 500 }
    )
  }
}
