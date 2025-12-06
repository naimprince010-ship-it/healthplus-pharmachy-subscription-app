import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BlogType, TopicBlock } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const block = searchParams.get('block')
    const type = searchParams.get('type')

    const where: {
      title?: { contains: string; mode: 'insensitive' }
      block?: TopicBlock
      type?: BlogType
    } = {}

    if (search) {
      where.title = { contains: search, mode: 'insensitive' }
    }
    if (block && block !== 'ALL') {
      where.block = block as TopicBlock
    }
    if (type && type !== 'ALL') {
      where.type = type as BlogType
    }

    const topics = await prisma.blogTopic.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ topics })
  } catch (error) {
    console.error('Error fetching blog topics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog topics' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, block, type, isActive } = body

    if (!title || !block || !type) {
      return NextResponse.json(
        { error: 'Title, block, and type are required' },
        { status: 400 }
      )
    }

    const topic = await prisma.blogTopic.create({
      data: {
        title,
        description: description || null,
        block: block as TopicBlock,
        type: type as BlogType,
        isActive: isActive ?? true,
      },
    })

    return NextResponse.json({ topic })
  } catch (error) {
    console.error('Error creating blog topic:', error)
    return NextResponse.json(
      { error: 'Failed to create blog topic' },
      { status: 500 }
    )
  }
}
