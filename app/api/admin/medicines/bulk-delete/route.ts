import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { deleteMedicineImage } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/medicines/bulk-delete
 * Delete multiple medicines at once
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No medicine IDs provided' },
        { status: 400 }
      )
    }

    const medicines = await prisma.medicine.findMany({
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
        requested: ids.length,
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
