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
import { cache } from 'react'
import { DEFAULT_BASIC_SETTINGS, type BasicSettings } from '@/lib/admin/settings'
import {
  DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS,
  mergeSubscriptionsPageSettings,
  type SubscriptionsPageSettings,
  SUBSCRIPTIONS_PAGE_SETTING_KEY,
} from '@/lib/subscriptions-page-settings'

/**
 * Fetch basic settings from database (server-side only)
 * Returns merged default + stored values
 */
export const getBasicSettings = cache(async (): Promise<BasicSettings> => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'basic' } })
    const value = (setting?.value ?? {}) as Partial<BasicSettings>
    return { ...DEFAULT_BASIC_SETTINGS, ...value }
  } catch (error) {
    console.error('[getBasicSettings] Error fetching settings:', error)
    return DEFAULT_BASIC_SETTINGS
  }
})

/** /subscriptions ল্যান্ডিং পেজের হিরো · ট্রাস্ট · কেন সাবস্ক্রাইব টেকস্ট (অ্যাডমিন থেকে সম্পাদনাযোগ্য) */
export const getSubscriptionsPageSettings = cache(async (): Promise<SubscriptionsPageSettings> => {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: SUBSCRIPTIONS_PAGE_SETTING_KEY },
    })
    return mergeSubscriptionsPageSettings(row?.value ?? {})
  } catch (e) {
    console.error('[getSubscriptionsPageSettings]', e)
    return DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS
  }
})
