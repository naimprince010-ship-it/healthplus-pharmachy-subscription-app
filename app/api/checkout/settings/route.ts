import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.checkoutPageSettings.findFirst()

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch checkout page settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch checkout page settings' },
      { status: 500 }
    )
  }
}
