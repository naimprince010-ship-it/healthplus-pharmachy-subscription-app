import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogType, TopicBlock } from '@prisma/client'

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

    const topic = await prisma.blogTopic.findUnique({
      where: { id },
      include: {
        blogs: {
          select: {
            id: true,
            title: true,
            status: true,
            publishedAt: true,
          },
        },
      },
    })

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error fetching blog topic:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog topic' },
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
    const { title, description, block, type, isActive } = body

    const existingTopic = await prisma.blogTopic.findUnique({
      where: { id },
    })

    if (!existingTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    const updateData: {
      title?: string
      description?: string | null
      block?: TopicBlock
      type?: BlogType
      isActive?: boolean
    } = {}

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description || null
    if (block !== undefined) updateData.block = block as TopicBlock
    if (type !== undefined) updateData.type = type as BlogType
    if (isActive !== undefined) updateData.isActive = isActive

    const topic = await prisma.blogTopic.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error updating blog topic:', error)
    return NextResponse.json(
      { error: 'Failed to update blog topic' },
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

    const existingTopic = await prisma.blogTopic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { blogs: true },
        },
      },
    })

    if (!existingTopic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    if (existingTopic._count.blogs > 0) {
      return NextResponse.json(
        { error: 'Cannot delete topic with associated blogs. Deactivate it instead.' },
        { status: 400 }
      )
    }

    await prisma.blogTopic.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog topic:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog topic' },
      { status: 500 }
    )
  }
}
