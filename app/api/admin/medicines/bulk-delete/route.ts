import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteMedicineImage } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface BulkDeleteFilters {
  search?: string
  categoryId?: string
  isActive?: string
}

function buildWhereFromFilters(filters: BulkDeleteFilters) {
  const where: any = {
    deletedAt: null,
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { genericName: { contains: filters.search, mode: 'insensitive' } },
      { brandName: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId
  }

  if (filters.isActive && filters.isActive !== 'all') {
    where.isActive = filters.isActive === 'true'
  }

  return where
}

/**
 * POST /api/admin/medicines/bulk-delete
 * Delete multiple medicines at once
 * Supports both:
 * - ids: string[] - delete specific medicines by ID
 * - selectAll: true + filters - delete all medicines matching filters
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, selectAll, filters } = body

    let medicines: { id: string; imagePath: string | null; _count: { orderItems: number } }[]

    if (selectAll && filters) {
      const where = buildWhereFromFilters(filters)
      medicines = await prisma.medicine.findMany({
        where,
        select: {
          id: true,
          imagePath: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      })
    } else if (ids && Array.isArray(ids) && ids.length > 0) {
      medicines = await prisma.medicine.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          imagePath: true,
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      })
    } else {
      return NextResponse.json(
        { error: 'No medicine IDs provided or selectAll with filters' },
        { status: 400 }
      )
    }

    let deleted = 0
    let softDeleted = 0
    const errors: { id: string; reason: string }[] = []

    for (const medicine of medicines) {
      try {
        if (medicine._count.orderItems > 0) {
          await prisma.medicine.update({
            where: { id: medicine.id },
            data: {
              isActive: false,
              deletedAt: new Date(),
            },
          })
          softDeleted++
        } else {
          if (medicine.imagePath) {
            try {
              await deleteMedicineImage(medicine.imagePath)
            } catch (error) {
              console.error(`Failed to delete image for medicine ${medicine.id}:`, error)
            }
          }

          await prisma.medicine.delete({
            where: { id: medicine.id },
          })
          deleted++
        }
      } catch (error) {
        console.error(`Error deleting medicine ${medicine.id}:`, error)
        errors.push({
          id: medicine.id,
          reason: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

        return NextResponse.json({
          success: true,
          summary: {
            requested: medicines.length,
            deleted,
            softDeleted,
            failed: errors.length,
            errors,
          },
        })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete medicines' },
      { status: 500 }
    )
  }
}
