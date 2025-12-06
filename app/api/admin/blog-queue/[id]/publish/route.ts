import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogStatus } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    const blog = await prisma.blog.findUnique({
      where: { id },
    })

    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    }

    if (blog.status === BlogStatus.PUBLISHED) {
      return NextResponse.json(
        { error: 'Blog is already published' },
        { status: 400 }
      )
    }

    if (blog.status === BlogStatus.TOPIC_ONLY) {
      return NextResponse.json(
        { error: 'Blog has no content. Generate content first.' },
        { status: 400 }
      )
    }

    if (!blog.contentMd) {
      return NextResponse.json(
        { error: 'Blog has no content to publish' },
        { status: 400 }
      )
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        status: BlogStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      blog: {
        id: updatedBlog.id,
        slug: updatedBlog.slug,
        title: updatedBlog.title,
        status: updatedBlog.status,
        publishedAt: updatedBlog.publishedAt,
      },
      publicUrl: `/blog/${updatedBlog.slug}`,
    })
  } catch (error) {
    console.error('Error publishing blog:', error)
    return NextResponse.json(
      { error: 'Failed to publish blog' },
      { status: 500 }
    )
  }
}
