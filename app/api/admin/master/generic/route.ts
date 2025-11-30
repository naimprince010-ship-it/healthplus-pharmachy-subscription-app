import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateSlug } from '@/lib/matching/masterMatching'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createGenericSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  synonyms: z.array(z.string()).optional(),
})

/**
 * POST /api/admin/master/generic
 * Create a new generic (active ingredient)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createGenericSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, synonyms } = validationResult.data

    // Check if generic already exists
    const existing = await prisma.generic.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: generateSlug(name) },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Generic with this name already exists', existingId: existing.id },
        { status: 409 }
      )
    }

    // Generate unique slug
    let slug = generateSlug(name)
    let slugSuffix = 1
    while (await prisma.generic.findUnique({ where: { slug } })) {
      slug = `${generateSlug(name)}-${slugSuffix}`
      slugSuffix++
    }

    // Create the generic
    const generic = await prisma.generic.create({
      data: {
        name: name.trim(),
        synonyms: synonyms && synonyms.length > 0 ? synonyms : null,
        slug,
      },
    })

    return NextResponse.json({
      success: true,
      generic: {
        id: generic.id,
        name: generic.name,
        synonyms: generic.synonyms,
        slug: generic.slug,
        createdAt: generic.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create generic error:', error)
    return NextResponse.json(
      { error: 'Failed to create generic' },
      { status: 500 }
    )
  }
}
