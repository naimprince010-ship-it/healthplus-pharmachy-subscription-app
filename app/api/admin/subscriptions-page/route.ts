import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'
import {
  subscriptionsPageSettingsSchema,
  SUBSCRIPTIONS_PAGE_SETTING_KEY,
  mergeSubscriptionsPageSettings,
} from '@/lib/subscriptions-page-settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { authorized, response } = await requireAdmin()
  if (!authorized) return response

  const row = await prisma.setting.findUnique({ where: { key: SUBSCRIPTIONS_PAGE_SETTING_KEY } })
  const merged = mergeSubscriptionsPageSettings(row?.value ?? {})
  return NextResponse.json(merged)
}

export async function PUT(request: NextRequest) {
  const { authorized, response } = await requireAdmin()
  if (!authorized) return response

  const body = await request.json().catch(() => null)
  const parsed = subscriptionsPageSettingsSchema.safeParse(body ?? {})
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  await prisma.setting.upsert({
    where: { key: SUBSCRIPTIONS_PAGE_SETTING_KEY },
    create: { key: SUBSCRIPTIONS_PAGE_SETTING_KEY, value: parsed.data },
    update: { value: parsed.data },
  })

  return NextResponse.json(parsed.data)
}
