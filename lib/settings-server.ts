/**
 * Server-side Settings Helpers
 * 
 * This file contains server-only functions for fetching settings.
 * These functions use Prisma and should ONLY be imported in server components.
 * 
 * DO NOT import this file in client components or files with 'use client'.
 */

import 'server-only'
import { prisma } from '@/lib/prisma'
import { DEFAULT_BASIC_SETTINGS, type BasicSettings } from '@/lib/admin/settings'

/**
 * Fetch basic settings from database (server-side only)
 * Returns merged default + stored values
 */
export async function getBasicSettings(): Promise<BasicSettings> {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'basic' } })
    const value = (setting?.value ?? {}) as Partial<BasicSettings>
    return { ...DEFAULT_BASIC_SETTINGS, ...value }
  } catch (error) {
    console.error('[getBasicSettings] Error fetching settings:', error)
    return DEFAULT_BASIC_SETTINGS
  }
}
