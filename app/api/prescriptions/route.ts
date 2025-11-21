import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, sendEmail, notifyAdmin } from '@/lib/notifications'
import { auth } from '@/lib/auth'
import { uploadPrescription, validatePrescriptionFile } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
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

    const validation = validatePrescriptionFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    let fileUrl: string | null = null
    try {
      fileUrl = await uploadPrescription(file)
    } catch (error) {
      console.error('File upload error:', error)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    const { prisma } = await import('@/lib/prisma')
    const { deletePrescription } = await import('@/lib/supabase')

    let userId = session?.user?.id

    if (!userId) {
      try {
        const guestUser = await prisma.user.upsert({
          where: { phone },
          update: {},
          create: {
            name,
            phone,
            password: '',
            role: 'USER',
          },
        })
        userId = guestUser.id
      } catch (error) {
        if (fileUrl) {
          try {
            await deletePrescription(fileUrl)
          } catch (deleteError) {
            console.error('Failed to clean up file after user creation error:', deleteError)
          }
        }
        throw error
      }
    }

    let prescription
    try {
      prescription = await prisma.prescription.create({
        data: {
          name,
          phone,
          zoneId,
          fileUrl,
          userId,
          status: 'PENDING',
        },
      })
    } catch (error) {
      if (fileUrl) {
        try {
          await deletePrescription(fileUrl)
        } catch (deleteError) {
          console.error('Failed to clean up file after prescription creation error:', deleteError)
        }
      }
      throw error
    }

    await Promise.all([
      sendSMS(phone, 'PRESCRIPTION_RECEIVED', { name }),
      sendEmail(`${phone}@example.com`, 'PRESCRIPTION_RECEIVED', { name }),
      notifyAdmin('ADMIN_NEW_PRESCRIPTION', {
        prescriptionId: prescription.id,
        customerName: name,
        phone,
      }),
    ])

    return NextResponse.json({ success: true, prescription })
  } catch (error) {
    console.error('Prescription upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload prescription' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { prisma } = await import('@/lib/prisma')

    const prescriptions = await prisma.prescription.findMany({
      where:
        session.user.role === 'ADMIN'
          ? {}
          : { userId: session.user.id },
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

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id, status } = await request.json()
    const { prisma } = await import('@/lib/prisma')

    const prescription = await prisma.prescription.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, prescription })
  } catch (error) {
    console.error('Update prescription error:', error)
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    )
  }
}
