import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCategorySchema } from '@/lib/validations/category'
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
    const status = searchParams.get('status')?.toUpperCase() || 'ALL'

    const where: {
      OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { slug: { contains: string; mode: 'insensitive' } }>
      isActive?: boolean
    } = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'ACTIVE') {
      where.isActive = true
    } else if (status === 'INACTIVE') {
      where.isActive = false
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { medicines: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Fetch categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
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
    
    if (body.parentId && !body.parentCategoryId) {
      body.parentCategoryId = body.parentId
    }
    
    const validatedData = createCategorySchema.parse(body)

    const existingSlug = await prisma.category.findUnique({
      where: { slug: validatedData.slug },
    })
    if (existingSlug) {
      return NextResponse.json(
        { error: 'A category with this slug already exists' },
        { status: 400 }
      )
    }

    const existingName = await prisma.category.findUnique({
      where: { name: validatedData.name },
    })
    if (existingName) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    if (validatedData.parentCategoryId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: validatedData.parentCategoryId },
      })
      if (!parentExists) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.category.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description || null,
        imageUrl: validatedData.imageUrl || null,
        parentCategoryId: validatedData.parentCategoryId || null,
        sortOrder: validatedData.sortOrder ?? 0,
        isActive: validatedData.isActive ?? true,
        isMedicineCategory: validatedData.isMedicineCategory ?? false,
        showInSidebar: validatedData.showInSidebar ?? false,
        sidebarOrder: validatedData.sidebarOrder ?? 0,
        sidebarIconUrl: validatedData.sidebarIconUrl || null,
        sidebarLinkUrl: validatedData.sidebarLinkUrl || null,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
