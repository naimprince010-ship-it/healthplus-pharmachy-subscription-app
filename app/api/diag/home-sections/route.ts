import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hasHomeSection = typeof (prisma as any).homeSection !== 'undefined'
    
    if (!hasHomeSection) {
      return NextResponse.json({
        ok: false,
        error: 'prisma.homeSection is undefined - Prisma client not regenerated',
        hasProperty: false,
      })
    }

    const rows = await prisma.homeSection.findMany({ take: 1 })
    
    return NextResponse.json({
      ok: true,
      hasHomeSection: true,
      rowCount: rows.length,
      message: 'HomeSection model is accessible',
    })
  } catch (e: any) {
    console.error('HomeSection diagnostic error:', e)
    return NextResponse.json({
      ok: false,
      error: String(e),
      message: e?.message || 'Unknown error',
      stack: e?.stack,
    })
  }
}
