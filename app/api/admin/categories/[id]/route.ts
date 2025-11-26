import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateCategorySchema } from '@/lib/validations/category'
import { z } from 'zod'

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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { medicines: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

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
    
    if (body.parentId && !body.parentCategoryId) {
      body.parentCategoryId = body.parentId
    }
    
    const validatedData = updateCategorySchema.parse({ ...body, id })

    const existingCategory = await prisma.category.findUnique({
      where: { id },
    })
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: validatedData.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'A category with this slug already exists' },
          { status: 400 }
        )
      }
    }

    if (validatedData.name && validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.category.findUnique({
        where: { name: validatedData.name },
      })
      if (nameExists) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        )
      }
    }

    if (validatedData.parentCategoryId !== undefined) {
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

        if (validatedData.parentCategoryId === id) {
          return NextResponse.json(
            { error: 'A category cannot be its own parent' },
            { status: 400 }
          )
        }

        let currentParentId: string | null = validatedData.parentCategoryId
        const visited = new Set([id])
        
        while (currentParentId) {
          if (visited.has(currentParentId)) {
            return NextResponse.json(
              { error: 'Circular reference detected: this would create a category loop' },
              { status: 400 }
            )
          }
          visited.add(currentParentId)
          
          const parent: { parentCategoryId: string | null } | null = await prisma.category.findUnique({
            where: { id: currentParentId },
            select: { parentCategoryId: true },
          })
          
          if (!parent) break
          currentParentId = parent.parentCategoryId
        }
      }
    }

    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      imageUrl?: string | null
      isActive?: boolean
      isMedicineCategory?: boolean
      parentCategoryId?: string | null
      sortOrder?: number
      showInSidebar?: boolean
      sidebarOrder?: number
      sidebarIconUrl?: string | null
    } = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isMedicineCategory !== undefined) updateData.isMedicineCategory = validatedData.isMedicineCategory
    if (validatedData.parentCategoryId !== undefined) updateData.parentCategoryId = validatedData.parentCategoryId
    if (validatedData.sortOrder !== undefined) updateData.sortOrder = validatedData.sortOrder
    if (validatedData.showInSidebar !== undefined) updateData.showInSidebar = validatedData.showInSidebar
    if (validatedData.sidebarOrder !== undefined) updateData.sidebarOrder = validatedData.sidebarOrder
    if (validatedData.sidebarIconUrl !== undefined) updateData.sidebarIconUrl = validatedData.sidebarIconUrl

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ category })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

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
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { medicines: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    if (category._count.medicines > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete category because ${category._count.medicines} medicine(s) are using it`,
          medicineCount: category._count.medicines,
          canForceDelete: true,
        },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
