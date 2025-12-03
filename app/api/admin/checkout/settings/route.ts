import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.checkoutPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.checkoutPageSettings.create({
        data: {},
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch checkout settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkout settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    let settings = await prisma.checkoutPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.checkoutPageSettings.create({
        data: body,
      })
    } else {
      settings = await prisma.checkoutPageSettings.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to update checkout settings:', error)
    return NextResponse.json(
      { error: 'Failed to update checkout settings' },
      { status: 500 }
    )
  }
}
