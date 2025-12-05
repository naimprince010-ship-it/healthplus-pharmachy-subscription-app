import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.membershipBannerSettings.findFirst()

    if (!settings) {
      settings = await prisma.membershipBannerSettings.create({
        data: {},
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch membership banner settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch membership banner settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    let settings = await prisma.membershipBannerSettings.findFirst()

    if (!settings) {
      settings = await prisma.membershipBannerSettings.create({
        data: body,
      })
    } else {
      settings = await prisma.membershipBannerSettings.update({
        where: { id: settings.id },
        data: body,
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to update membership banner settings:', error)
    return NextResponse.json(
      { error: 'Failed to update membership banner settings' },
      { status: 500 }
    )
  }
}
