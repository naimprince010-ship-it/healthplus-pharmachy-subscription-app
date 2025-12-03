import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.orderTrackingSettings.findFirst()

    if (!settings) {
      settings = await prisma.orderTrackingSettings.create({
        data: {},
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch order tracking settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order tracking settings' },
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

    let settings = await prisma.orderTrackingSettings.findFirst()

    if (!settings) {
      settings = await prisma.orderTrackingSettings.create({
        data: body,
      })
    } else {
      settings = await prisma.orderTrackingSettings.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to update order tracking settings:', error)
    return NextResponse.json(
      { error: 'Failed to update order tracking settings' },
      { status: 500 }
    )
  }
}
