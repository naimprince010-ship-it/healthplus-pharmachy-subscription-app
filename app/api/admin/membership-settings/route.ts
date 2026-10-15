import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAdmin } from '@/lib/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const authResult = await requireAdmin()
  if (!authResult.authorized) return authResult.response

  try {
    const { prisma } = await import('@/lib/prisma')
    const settings = await prisma.membershipPageSettings.findFirst()
    return NextResponse.json(
      settings ?? {
        heroHeadlineBn: 'প্রতি মাসে ওষুধের খরচ ২০% কমান এবং ডাক্তারের পরামর্শ নিন একদম ফ্রি!',
        heroSubheadlineBn: 'আপনার পরিবারের মাসিক ওষুধ ফুরিয়ে যাওয়া নিয়ে চিন্তিত? আমরা দায়িত্ব নিচ্ছি।',
        guaranteeTextBn: '🔒 কোনো দীর্ঘমেয়াদী চুক্তি নেই — যেকোনো সময় বাতিল করতে পারবেন',
        testimonialsJson: [],
      },
    )
  } catch {
    return NextResponse.json(
      {
        heroHeadlineBn: 'প্রতি মাসে ওষুধের খরচ ২০% কমান এবং ডাক্তারের পরামর্শ নিন একদম ফ্রি!',
        heroSubheadlineBn: 'আপনার পরিবারের মাসিক ওষুধ ফুরিয়ে যাওয়া নিয়ে চিন্তিত? আমরা দায়িত্ব নিচ্ছি।',
        guaranteeTextBn: '🔒 কোনো দীর্ঘমেয়াদী চুক্তি নেই — যেকোনো সময় বাতিল করতে পারবেন',
        testimonialsJson: [],
      },
      { status: 200 },
    )
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const { prisma } = await import('@/lib/prisma')
    const existing = await prisma.membershipPageSettings.findFirst()
    const saved = existing
      ? await prisma.membershipPageSettings.update({ where: { id: existing.id }, data: body })
      : await prisma.membershipPageSettings.create({ data: body })
    return NextResponse.json(saved)
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
