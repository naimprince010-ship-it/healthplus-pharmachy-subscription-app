import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Validation schema for updating landing pages
const updateLandingPageSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only').optional(),
  sections: z.array(z.object({
    id: z.string(),
    type: z.enum(['hero', 'problem', 'benefits', 'howItWorks', 'pricing', 'testimonials', 'faq', 'finalCta']),
    order: z.number(),
    config: z.record(z.unknown()),
  })).optional(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
})

// GET - Fetch a single landing page by ID
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

    const landingPage = await prisma.landingPage.findUnique({
      where: { id },
    })

    if (!landingPage) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
    }

    return NextResponse.json({ landingPage })
  } catch (error) {
    console.error('Fetch landing page error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch landing page' },
      { status: 500 }
    )
  }
}

// PUT - Update a landing page
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
    const validatedData = updateLandingPageSchema.parse(body)

    // Check if landing page exists
    const existing = await prisma.landingPage.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
    }

    // Check for duplicate slug if slug is being changed
    if (validatedData.slug && validatedData.slug !== existing.slug) {
      const existingSlug = await prisma.landingPage.findUnique({
        where: { slug: validatedData.slug },
      })
      if (existingSlug) {
        return NextResponse.json(
          { error: 'A landing page with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.sections !== undefined) updateData.sections = validatedData.sections
    if (validatedData.metaTitle !== undefined) updateData.metaTitle = validatedData.metaTitle
    if (validatedData.metaDescription !== undefined) updateData.metaDescription = validatedData.metaDescription
    if (validatedData.primaryColor !== undefined) updateData.primaryColor = validatedData.primaryColor
    
    // Handle status change
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
      if (validatedData.status === 'PUBLISHED' && !existing.publishedAt) {
        updateData.publishedAt = new Date()
      }
    }

    const landingPage = await prisma.landingPage.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ landingPage })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Update landing page error:', error)
    return NextResponse.json(
      { error: 'Failed to update landing page' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a landing page
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

    // Check if landing page exists
    const existing = await prisma.landingPage.findUnique({
      where: { id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Landing page not found' }, { status: 404 })
    }

    await prisma.landingPage.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete landing page error:', error)
    return NextResponse.json(
      { error: 'Failed to delete landing page' },
      { status: 500 }
    )
  }
}
