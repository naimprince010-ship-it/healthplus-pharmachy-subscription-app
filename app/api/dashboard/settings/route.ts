import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    let settings = await prisma.dashboardPageSettings.findFirst()

    if (!settings) {
      settings = await prisma.dashboardPageSettings.create({
        data: {},
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Failed to fetch dashboard settings:', error)
    // Fall back to safe defaults so preview builds don’t fail
    return NextResponse.json({ settings: {} })
  }
}
