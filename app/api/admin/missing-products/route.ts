import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const STEP_ALIASES: Record<number, string[]> = {
  1: ['cleanser', 'face wash', 'facewash', 'foam wash', 'cleansing', 'ক্লিনজার', 'ফেসওয়াশ'],
  2: ['toner', 'toning', 'টোনার'],
  3: ['serum', 'essence', 'ampoule', 'vitamin c', 'niacinamide', 'সিরাম'],
  4: ['moisturizer', 'moisturiser', 'cream', 'lotion', 'ময়েশ্চারাইজার'],
  5: ['sunscreen', 'sun screen', 'sunblock', 'spf', 'সানস্ক্রিন'],
}

function detectStep(name: string, reason: string): number | null {
  const text = `${name} ${reason}`.toLowerCase()
  const stepMatch = text.match(/\bstep\s*(\d+)\b/)
  if (stepMatch) return Number(stepMatch[1])
  for (const [step, aliases] of Object.entries(STEP_ALIASES)) {
    if (aliases.some((a) => text.includes(a))) return Number(step)
  }
  return null
}

/** DELETE /api/admin/missing-products?action=cleanup — remove false positives */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    if (searchParams.get('action') !== 'cleanup') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const blogs = await prisma.blog.findMany({
      select: {
        id: true,
        missingProducts: {
          where: { isResolved: false },
          select: { id: true, name: true, reason: true },
        },
        blogProducts: {
          select: { stepOrder: true, role: true },
        },
      },
    })

    const toDelete: string[] = []

    for (const blog of blogs) {
      const mappedSteps = new Set(
        blog.blogProducts
          .filter((bp) => bp.role === 'step' && typeof bp.stepOrder === 'number')
          .map((bp) => bp.stepOrder as number)
      )

      for (const mp of blog.missingProducts) {
        const step = detectStep(mp.name, mp.reason ?? '')
        if (step !== null && mappedSteps.has(step)) {
          toDelete.push(mp.id)
        }
      }
    }

    if (toDelete.length > 0) {
      await prisma.missingProduct.deleteMany({ where: { id: { in: toDelete } } })
    }

    return NextResponse.json({ deleted: toDelete.length })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Failed to cleanup' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get('resolved')
    const search = searchParams.get('search')

    const where: {
      isResolved?: boolean
      name?: { contains: string; mode: 'insensitive' }
    } = {}

    if (resolved === 'true') {
      where.isResolved = true
    } else if (resolved === 'false') {
      where.isResolved = false
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const missingProducts = await prisma.missingProduct.findMany({
      where,
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ missingProducts })
  } catch (error) {
    console.error('Error fetching missing products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch missing products' },
      { status: 500 }
    )
  }
}
