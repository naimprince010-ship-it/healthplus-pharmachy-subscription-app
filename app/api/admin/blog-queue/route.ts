import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogStatus, BlogType } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: {
      status?: BlogStatus
      type?: BlogType
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' }; slug?: { contains: string; mode: 'insensitive' } }>
    } = {}

    if (status && status !== 'all') {
      where.status = status as BlogStatus
    }
    if (type && type !== 'all') {
      where.type = type as BlogType
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const blogs = await prisma.blog.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        block: true,
        status: true,
        summary: true,
        contentMd: true,
        seoTitle: true,
        seoDescription: true,
        scheduledAt: true,
        publishedAt: true,
        createdAt: true,
        topic: { select: { title: true } },
        _count: {
          select: {
            blogProducts: true,
            missingProducts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ blogs })
  } catch (error) {
    console.error('Error fetching blog queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog queue' },
      { status: 500 }
    )
  }
}
