import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadMedicineImage, validateMedicineImage, deleteMedicineImage } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/uploads/medicine-image
 * Upload a medicine image to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const medicineId = formData.get('medicineId') as string | undefined

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const validation = validateMedicineImage(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const result = await uploadMedicineImage(file, medicineId)

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
      mimeType: result.mimeType,
      size: result.size,
    })
  } catch (error) {
    console.error('Medicine image upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/uploads/medicine-image
 * Delete a medicine image from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'No path provided' }, { status: 400 })
    }

    await deleteMedicineImage(path)

    return NextResponse.json({ success: true, message: 'Image deleted successfully' })
  } catch (error) {
    console.error('Medicine image delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete image' },
      { status: 500 }
    )
  }
}
