import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Validation schema for creating/updating landing pages
const landingPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  sections: z.array(z.object({
    id: z.string(),
    type: z.enum(['hero', 'problem', 'benefits', 'howItWorks', 'pricing', 'testimonials', 'faq', 'finalCta']),
    order: z.number(),
    config: z.record(z.unknown()),
  })).default([]),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
})

// GET - List all landing pages with search
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')?.toUpperCase() || 'ALL'

    const where: {
      OR?: Array<{ title: { contains: string; mode: 'insensitive' } } | { slug: { contains: string; mode: 'insensitive' } }>
      status?: 'DRAFT' | 'PUBLISHED'
    } = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'DRAFT' || status === 'PUBLISHED') {
      where.status = status
    }

    const landingPages = await prisma.landingPage.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        primaryColor: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    })

    return NextResponse.json({ landingPages })
  } catch (error) {
    console.error('Fetch landing pages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch landing pages' },
      { status: 500 }
    )
  }
}

// POST - Create a new landing page
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = landingPageSchema.parse(body)

    // Check for duplicate slug
    const existingSlug = await prisma.landingPage.findUnique({
      where: { slug: validatedData.slug },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A landing page with this slug already exists' },
        { status: 400 }
      )
    }

    const landingPage = await prisma.landingPage.create({
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        sections: validatedData.sections,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        primaryColor: validatedData.primaryColor || '#036666',
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ landingPage }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Create landing page error:', error)
    return NextResponse.json(
      { error: 'Failed to create landing page' },
      { status: 500 }
    )
  }
}
