import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.checkoutPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.checkoutPageSettings.create({
        data: {},
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch checkout page settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkout page settings' },
      { status: 500 }
    )
  }
}
