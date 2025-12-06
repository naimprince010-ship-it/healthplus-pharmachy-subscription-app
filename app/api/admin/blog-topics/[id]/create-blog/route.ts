import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function generateSlug(title: string): string {
  const date = new Date()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
  
  return `${slug}-${dateStr}`
}

export async function POST(
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
    })

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    if (!topic.isActive) {
      return NextResponse.json(
        { error: 'Topic is not active' },
        { status: 400 }
      )
    }

    const existingBlog = await prisma.blog.findFirst({
      where: {
        topicId: id,
        status: { not: BlogStatus.PUBLISHED },
      },
    })

    if (existingBlog) {
      return NextResponse.json({
        success: true,
        message: 'Blog already exists for this topic',
        blog: {
          id: existingBlog.id,
          slug: existingBlog.slug,
          title: existingBlog.title,
          status: existingBlog.status,
        },
        alreadyExists: true,
      })
    }

    const slug = generateSlug(topic.title)

    const existingSlug = await prisma.blog.findUnique({
      where: { slug },
    })

    const finalSlug = existingSlug 
      ? `${slug}-${Date.now().toString(36)}`
      : slug

    const blog = await prisma.blog.create({
      data: {
        slug: finalSlug,
        type: topic.type,
        block: topic.block,
        title: topic.title,
        summary: topic.description,
        status: BlogStatus.TOPIC_ONLY,
        topicId: topic.id,
        scheduledAt: new Date(),
      },
    })

    await prisma.blogTopic.update({
      where: { id: topic.id },
      data: {
        lastUsedAt: new Date(),
        timesUsed: { increment: 1 },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Blog created successfully',
      blog: {
        id: blog.id,
        slug: blog.slug,
        title: blog.title,
        status: blog.status,
      },
      alreadyExists: false,
    })
  } catch (error) {
    console.error('Error creating blog from topic:', error)
    return NextResponse.json(
      { error: 'Failed to create blog', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
