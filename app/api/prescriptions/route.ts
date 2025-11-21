import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, sendEmail } from '@/lib/notifications'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const zoneId = formData.get('zoneId') as string
    const file = formData.get('file') as File

    if (!name || !phone || !file) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fileUrl = `/uploads/prescriptions/${Date.now()}-${file.name}`
    const { prisma } = await import('@/lib/prisma')

    const prescription = await prisma.prescription.create({
      data: {
        name,
        phone,
        zoneId,
        fileUrl,
        userId: 'guest', // For guest uploads
        status: 'PENDING',
      },
    })

    await sendSMS(phone, 'PRESCRIPTION_RECEIVED', { name })
    await sendEmail(`${phone}@example.com`, 'PRESCRIPTION_RECEIVED', { name })

    return NextResponse.json({ success: true, prescription })
  } catch (error) {
    console.error('Prescription upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload prescription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const { prisma } = await import('@/lib/prisma')

    const prescriptions = await prisma.prescription.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ prescriptions })
  } catch (error) {
    console.error('Fetch prescriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    )
  }
}
