import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { generateSlug } from '@/lib/matching/masterMatching'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createManufacturerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  aliasList: z.array(z.string()).optional(),
  requiresQcVerification: z.boolean().optional().default(true),
})

/**
 * POST /api/admin/master/manufacturer
 * Create a new manufacturer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const validationResult = createManufacturerSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { name, aliasList, requiresQcVerification } = validationResult.data

    // Check if manufacturer already exists
    const existing = await prisma.manufacturer.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { slug: generateSlug(name) },
        ],
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Manufacturer with this name already exists', existingId: existing.id },
        { status: 409 }
      )
    }

    // Generate unique slug
    let slug = generateSlug(name)
    let slugSuffix = 1
    while (await prisma.manufacturer.findUnique({ where: { slug } })) {
      slug = `${generateSlug(name)}-${slugSuffix}`
      slugSuffix++
    }

    // Create the manufacturer
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: name.trim(),
        aliasList: aliasList && aliasList.length > 0 ? aliasList : Prisma.JsonNull,
        slug,
        requiresQcVerification,
      },
    })

    return NextResponse.json({
      success: true,
      manufacturer: {
        id: manufacturer.id,
        name: manufacturer.name,
        aliasList: manufacturer.aliasList,
        slug: manufacturer.slug,
        requiresQcVerification: manufacturer.requiresQcVerification,
        createdAt: manufacturer.createdAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create manufacturer error:', error)
    return NextResponse.json(
      { error: 'Failed to create manufacturer' },
      { status: 500 }
    )
  }
}
