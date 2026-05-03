import { NextRequest, NextResponse } from 'next/server'
import { BlogSponsorPlacement } from '@prisma/client'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  sponsorLabel: z.string().min(1).max(200),
  imageUrl: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : undefined))
    .refine((v) => !v || /^https?:\/\//i.test(v), { message: 'imageUrl must be an http(s) URL' }),
  headline: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : undefined)),
  targetUrl: z.string().url().max(2000),
  placement: z.nativeEnum(BlogSponsorPlacement),
  priority: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  startAt: z
    .string()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || !String(v).trim()) return undefined
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? undefined : d
    }),
  endAt: z
    .string()
    .max(40)
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || !String(v).trim()) return undefined
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? undefined : d
    }),
  internalNotes: z.string().max(8000).optional().nullable(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const ads = await prisma.blogSponsorAd.findMany({
      orderBy: [{ placement: 'asc' }, { priority: 'desc' }, { updatedAt: 'desc' }],
    })
    return NextResponse.json({ ads })
  } catch (e) {
    console.error('[blog-sponsor-ads GET]', e)
    return NextResponse.json({ error: 'Failed to list sponsor ads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = createSchema.parse(body)

    if (!data.imageUrl && !data.headline) {
      return NextResponse.json(
        { error: 'Provide either an image URL or a short headline/text for the ad.' },
        { status: 400 }
      )
    }

    const ad = await prisma.blogSponsorAd.create({
      data: {
        sponsorLabel: data.sponsorLabel.trim(),
        imageUrl: data.imageUrl ?? undefined,
        headline: data.headline ?? undefined,
        targetUrl: data.targetUrl.trim(),
        placement: data.placement,
        priority: data.priority,
        isActive: data.isActive,
        startAt: data.startAt ?? null,
        endAt: data.endAt ?? null,
        internalNotes: data.internalNotes?.trim() || null,
      },
    })
    return NextResponse.json({ ad }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.flatten() }, { status: 400 })
    }
    console.error('[blog-sponsor-ads POST]', e)
    return NextResponse.json({ error: 'Failed to create sponsor ad' }, { status: 500 })
  }
}
