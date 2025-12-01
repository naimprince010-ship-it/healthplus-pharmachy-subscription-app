import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createManufacturerSchema } from '@/lib/validations/manufacturer'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: {
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { slug: { contains: string; mode: 'insensitive' } }>
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [manufacturers, total] = await Promise.all([
      prisma.manufacturer.findMany({
        where,
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.manufacturer.count({ where }),
    ])

    return NextResponse.json({
      manufacturers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Fetch manufacturers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturers' },
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
    
        // Clean up empty strings to null for optional URL fields
        if (body.logoUrl === '') body.logoUrl = null
        if (body.websiteUrl === '') body.websiteUrl = null
        if (body.phoneNumber === '') body.phoneNumber = null
    
    const validatedData = createManufacturerSchema.parse(body)

    // Check for existing slug
    const existingSlug = await prisma.manufacturer.findUnique({
      where: { slug: validatedData.slug },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A manufacturer with this slug already exists' },
        { status: 400 }
      )
    }

    // Check for existing name
    const existingName = await prisma.manufacturer.findUnique({
      where: { name: validatedData.name },
    })
    if (existingName) {
      return NextResponse.json(
        { error: 'A manufacturer with this name already exists' },
        { status: 400 }
      )
    }

                const manufacturer = await prisma.manufacturer.create({
                  data: {
                    name: validatedData.name,
                    slug: validatedData.slug,
                    logoUrl: validatedData.logoUrl || null,
                    websiteUrl: validatedData.websiteUrl || null,
                    description: validatedData.description || null,
                    phoneNumber: validatedData.phoneNumber || null,
                    aliasList: validatedData.aliasList ? validatedData.aliasList : Prisma.JsonNull,
                  },
                })

    return NextResponse.json({ manufacturer }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Create manufacturer error:', error)
    return NextResponse.json(
      { error: 'Failed to create manufacturer' },
      { status: 500 }
    )
  }
}
