import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
