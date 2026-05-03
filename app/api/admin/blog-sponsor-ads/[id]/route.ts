import { NextRequest, NextResponse } from 'next/server'
import { BlogSponsorPlacement } from '@prisma/client'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const patchSchema = z
  .object({
    sponsorLabel: z.string().min(1).max(200).optional(),
    imageUrl: z
      .string()
      .max(2000)
      .nullable()
      .optional()
      .transform((v) => (v === null ? null : v && v.trim() ? v.trim() : undefined)),
    headline: z
      .string()
      .max(500)
      .nullable()
      .optional()
      .transform((v) => (v === null ? null : v && v.trim() ? v.trim() : undefined)),
    targetUrl: z.string().url().max(2000).optional(),
    placement: z.nativeEnum(BlogSponsorPlacement).optional(),
    priority: z.number().int().optional(),
    isActive: z.boolean().optional(),
    startAt: z
      .union([z.string().max(40), z.null()])
      .optional()
      .transform((v) => {
        if (v === null) return null
        if (v === undefined) return undefined
        if (!String(v).trim()) return null
        const d = new Date(v)
        return Number.isNaN(d.getTime()) ? undefined : d
      }),
    endAt: z
      .union([z.string().max(40), z.null()])
      .optional()
      .transform((v) => {
        if (v === null) return null
        if (v === undefined) return undefined
        if (!String(v).trim()) return null
        const d = new Date(v)
        return Number.isNaN(d.getTime()) ? undefined : d
      }),
    internalNotes: z.string().max(8000).nullable().optional(),
  })
  .strict()

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    const existing = await prisma.blogSponsorAd.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const raw = await request.json()
    const data = patchSchema.parse(raw)

    const nextImage = data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl
    const nextHeadline = data.headline !== undefined ? data.headline : existing.headline
    if (
      !(nextImage && String(nextImage).trim()) &&
      !(nextHeadline && String(nextHeadline).trim())
    ) {
      return NextResponse.json(
        { error: 'Provide either an image URL or a headline (one can be cleared only if the other is set).' },
        { status: 400 }
      )
    }

    const ad = await prisma.blogSponsorAd.update({
      where: { id },
      data: {
        ...(data.sponsorLabel !== undefined && { sponsorLabel: data.sponsorLabel.trim() }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.headline !== undefined && { headline: data.headline }),
        ...(data.targetUrl !== undefined && { targetUrl: data.targetUrl.trim() }),
        ...(data.placement !== undefined && { placement: data.placement }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.startAt !== undefined && {
          startAt: data.startAt === null ? null : data.startAt,
        }),
        ...(data.endAt !== undefined && { endAt: data.endAt === null ? null : data.endAt }),
        ...(data.internalNotes !== undefined && {
          internalNotes: data.internalNotes === null ? null : data.internalNotes?.trim() ?? null,
        }),
      },
    })
    return NextResponse.json({ ad })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: e.flatten() }, { status: 400 })
    }
    console.error('[blog-sponsor-ads PATCH]', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.role || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  try {
    await prisma.blogSponsorAd.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Not found or delete failed' }, { status: 404 })
  }
}
