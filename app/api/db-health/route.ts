import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const result = await prisma.category.findFirst({
      select: {
        id: true,
        name: true,
        parentCategoryId: true,
        sortOrder: true,
      },
    })

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful and Category columns exist',
      sampleCategory: result,
      columnsChecked: ['id', 'name', 'parentCategoryId', 'sortOrder'],
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database health check failed',
        error: error.message || String(error),
        errorName: error.name || 'Unknown',
        columnsChecked: ['id', 'name', 'parentCategoryId', 'sortOrder'],
      },
      { status: 500 }
    )
  }
}
