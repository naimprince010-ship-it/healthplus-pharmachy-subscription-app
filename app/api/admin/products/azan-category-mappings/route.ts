import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const upsertSchema = z.object({
  sourceCategoryKey: z.string().min(1),
  sourceCategoryLabel: z.string().optional(),
  localCategoryId: z.string().min(1),
  isActive: z.boolean().optional().default(true),
})

async function ensureAdmin() {
  const session = await auth()
  return !!session && session.user.role === 'ADMIN'
}

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const [mappings, categories, unmappedSourceGroups] = await Promise.all([
    prisma.azanCategoryMapping.findMany({
      orderBy: [{ sourceCategoryKey: 'asc' }],
      include: {
        localCategory: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.product.groupBy({
      by: ['sourceCategoryName'],
      where: {
        deletedAt: null,
        sourceCategoryName: { not: null },
        NOT: { sourceCategoryName: { equals: '' } },
      },
      _count: { _all: true },
      orderBy: { _count: { sourceCategoryName: 'desc' } },
    }),
  ])

  const mappedKeys = new Set(mappings.map((m) => m.sourceCategoryKey.trim().toLowerCase()))
  const unmapped = unmappedSourceGroups
    .filter((g) => !!g.sourceCategoryName)
    .map((g) => {
      const label = g.sourceCategoryName as string
      return {
        sourceCategoryLabel: label,
        sourceCategoryKey: label.trim().toLowerCase(),
        products: g._count._all,
      }
    })
    .filter((g) => !mappedKeys.has(g.sourceCategoryKey))

  return NextResponse.json({
    success: true,
    mappings,
    categories,
    unmapped,
  })
}

export async function POST(request: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = upsertSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data
  const sourceCategoryKey = payload.sourceCategoryKey.trim().toLowerCase()

  const mapping = await prisma.azanCategoryMapping.upsert({
    where: { sourceCategoryKey },
    update: {
      sourceCategoryLabel: payload.sourceCategoryLabel?.trim() || payload.sourceCategoryKey.trim(),
      localCategoryId: payload.localCategoryId,
      isActive: payload.isActive,
    },
    create: {
      sourceCategoryKey,
      sourceCategoryLabel: payload.sourceCategoryLabel?.trim() || payload.sourceCategoryKey.trim(),
      localCategoryId: payload.localCategoryId,
      isActive: payload.isActive,
    },
  })

  return NextResponse.json({ success: true, mapping })
}

export async function DELETE(request: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  await prisma.azanCategoryMapping.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
