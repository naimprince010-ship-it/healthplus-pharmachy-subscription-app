/**
 * Admin Settings API
 * 
 * This is the unified settings API for all admin settings sections.
 * No previous settings API existed in this codebase.
 * 
 * GET /api/admin/settings/[key] - Fetch settings for a section
 * PUT /api/admin/settings/[key] - Update settings for a section
 * 
 * Auth: Only allows logged-in admin users (uses requireAdmin helper)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'
import { getDefaultValueForKey, isValidSettingsKey } from '@/lib/settings-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ key: string }>
}

/**
 * GET /api/admin/settings/[key]
 * Fetch settings for a specific section
 * Returns the stored value or default if not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { authorized, response } = await requireAdmin()
  if (!authorized) return response

  const { key } = await params

  if (!isValidSettingsKey(key)) {
    return NextResponse.json(
      { error: `Invalid settings key: ${key}` },
      { status: 400 }
    )
  }

  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    })

    if (setting) {
      return NextResponse.json(setting.value)
    }

    return NextResponse.json(getDefaultValueForKey(key))
  } catch (error) {
    // Check if this is a "table not found" error (P2021) or similar Prisma error
    // This happens when the Setting table hasn't been created yet (migration not run)
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2021' || prismaError.code === 'P2010') {
      console.warn(`[Settings API] Setting table not found. Please run: npx prisma db push`)
      // Return defaults so the UI can still render
      return NextResponse.json(getDefaultValueForKey(key))
    }
    
    console.error(`[Settings API] Error fetching settings for key "${key}":`, error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/settings/[key]
 * Update settings for a specific section
 * Uses upsert: creates if not exists, updates if exists
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { authorized, response } = await requireAdmin()
  if (!authorized) return response

  const { key } = await params

  if (!isValidSettingsKey(key)) {
    return NextResponse.json(
      { error: `Invalid settings key: ${key}` },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: body },
      create: { key, value: body },
    })

    return NextResponse.json(setting.value)
  } catch (error) {
    // Check if this is a "table not found" error (P2021) or similar Prisma error
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2021' || prismaError.code === 'P2010') {
      console.warn(`[Settings API] Setting table not found. Please run: npx prisma db push`)
      return NextResponse.json(
        { error: 'Settings storage not initialized. Please run database migration (npx prisma db push).' },
        { status: 503 }
      )
    }
    
    console.error(`[Settings API] Error updating settings for key "${key}":`, error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
