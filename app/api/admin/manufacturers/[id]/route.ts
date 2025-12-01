import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { updateManufacturerSchema } from '@/lib/validations/manufacturer'
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

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ manufacturer })
  } catch (error) {
    console.error('Error fetching manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch manufacturer' },
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
    
        // Clean up empty strings to null for optional URL fields
        if (body.logoUrl === '') body.logoUrl = null
        if (body.websiteUrl === '') body.websiteUrl = null
        if (body.phoneNumber === '') body.phoneNumber = null
    
    const validatedData = updateManufacturerSchema.parse({ ...body, id })

    const existingManufacturer = await prisma.manufacturer.findUnique({
      where: { id },
    })
    if (!existingManufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      )
    }

    // Check for slug uniqueness if changed
    if (validatedData.slug && validatedData.slug !== existingManufacturer.slug) {
      const slugExists = await prisma.manufacturer.findUnique({
        where: { slug: validatedData.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'A manufacturer with this slug already exists' },
          { status: 400 }
        )
      }
    }

    // Check for name uniqueness if changed
    if (validatedData.name && validatedData.name !== existingManufacturer.name) {
      const nameExists = await prisma.manufacturer.findUnique({
        where: { name: validatedData.name },
      })
      if (nameExists) {
        return NextResponse.json(
          { error: 'A manufacturer with this name already exists' },
          { status: 400 }
        )
      }
    }

                const updateData: Prisma.ManufacturerUpdateInput = {}
    
                if (validatedData.name !== undefined) updateData.name = validatedData.name
                if (validatedData.slug !== undefined) updateData.slug = validatedData.slug
                if (validatedData.logoUrl !== undefined) updateData.logoUrl = validatedData.logoUrl
                if (validatedData.websiteUrl !== undefined) updateData.websiteUrl = validatedData.websiteUrl
                if (validatedData.description !== undefined) updateData.description = validatedData.description
                if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber
                if (validatedData.aliasList !== undefined) {
                  updateData.aliasList = validatedData.aliasList ? validatedData.aliasList : Prisma.JsonNull
                }

        const manufacturer = await prisma.manufacturer.update({
          where: { id },
          data: updateData,
        })

    return NextResponse.json({ manufacturer })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to update manufacturer' },
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

    const manufacturer = await prisma.manufacturer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!manufacturer) {
      return NextResponse.json(
        { error: 'Manufacturer not found' },
        { status: 404 }
      )
    }

    // Check if manufacturer has linked products
    if (manufacturer._count.products > 0 && !force) {
      return NextResponse.json(
        {
          error: `Cannot delete manufacturer because ${manufacturer._count.products} product(s) are linked to it`,
          productCount: manufacturer._count.products,
          canForceDelete: true,
        },
        { status: 400 }
      )
    }

    // If force delete, set manufacturerId to null for all linked products first
    if (force && manufacturer._count.products > 0) {
      await prisma.product.updateMany({
        where: { manufacturerId: id },
        data: { manufacturerId: null },
      })
    }

    await prisma.manufacturer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Manufacturer deleted successfully' })
  } catch (error) {
    console.error('Error deleting manufacturer:', error)
    return NextResponse.json(
      { error: 'Failed to delete manufacturer' },
      { status: 500 }
    )
  }
}
