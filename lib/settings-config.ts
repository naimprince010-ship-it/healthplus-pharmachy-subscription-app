/**
 * Admin Settings Configuration
 * 
 * This file defines all settings sections available in the admin panel.
 * No previous settings configuration existed in this codebase.
 * 
 * This unified config drives:
 * - The /admin/settings overview page (card layout)
 * - The dynamic /admin/settings/[section] pages
 * - Default values for the GET API when no data exists
 * 
 * To add a new settings section:
 * 1. Add a new key to SettingsSectionKey type
 * 2. Add the section config to SETTINGS_SECTIONS array
 * 3. (Phase 2) Create the form component for that section
 */

import {
  Store,
  Palette,
  Globe,
  DollarSign,
  Truck,
  LogIn,
  ShieldBan,
  Server,
  ShoppingCart,
  KeyRound,
  Package,
  ListOrdered,
  Tag,
  FileText,
  Facebook,
  Share2,
  BarChart3,
  Code,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { DEFAULT_BASIC_SETTINGS, type BasicSettings } from '@/lib/admin/settings'

// All available settings section keys
export type SettingsSectionKey =
  | 'basic'
  | 'branding'
  | 'domain'
  | 'currency'
  | 'charges'
  | 'login'
  | 'ip-block'
  | 'dns'
  | 'checkout'
  | 'order-otp'
  | 'stock'
  | 'order-status'
  | 'order-label'
  | 'invoice-template'
  | 'facebook-pixel'
  | 'facebook-capi'
  | 'tiktok-pixel'
  | 'gtm'
  | 'ga4'
  | 'gdpr'

// Settings group categories
export type SettingsGroup = 'shop' | 'orders' | 'integrations' | 'misc'

// Configuration for each settings section
export interface SettingsSectionConfig {
  key: SettingsSectionKey
  path: string
  title: string
  description: string
  group: SettingsGroup
  icon: LucideIcon
  defaultValue: Record<string, unknown>
}

// Group metadata for display
export const SETTINGS_GROUPS: Record<SettingsGroup, { title: string; order: number }> = {
  shop: { title: 'Shop Settings', order: 1 },
  orders: { title: 'Order Management', order: 2 },
  integrations: { title: 'Integrations', order: 3 },
  misc: { title: 'Miscellaneous', order: 4 },
}

// All settings sections configuration
export const SETTINGS_SECTIONS: SettingsSectionConfig[] = [
  // Shop Settings
  {
    key: 'basic',
    path: '/admin/settings/basic',
    title: 'Basic Settings',
    description: 'Store name, contact info, and general settings',
    group: 'shop',
    icon: Store,
    defaultValue: {},
  },
  {
    key: 'branding',
    path: '/admin/settings/branding',
    title: 'Branding Settings',
    description: 'Logo, colors, and visual identity',
    group: 'shop',
    icon: Palette,
    defaultValue: {},
  },
  {
    key: 'domain',
    path: '/admin/settings/domain',
    title: 'Domain Settings',
    description: 'Custom domain configuration',
    group: 'shop',
    icon: Globe,
    defaultValue: {},
  },
  {
    key: 'currency',
    path: '/admin/settings/currency',
    title: 'Currency Settings',
    description: 'Currency format and display options',
    group: 'shop',
    icon: DollarSign,
    defaultValue: {},
  },
  {
    key: 'charges',
    path: '/admin/settings/charges',
    title: 'Charges Settings',
    description: 'Delivery charges and additional fees',
    group: 'shop',
    icon: Truck,
    defaultValue: {},
  },
  {
    key: 'login',
    path: '/admin/settings/login',
    title: 'Login Settings',
    description: 'Authentication and login options',
    group: 'shop',
    icon: LogIn,
    defaultValue: {},
  },
  {
    key: 'ip-block',
    path: '/admin/settings/ip-block',
    title: 'IP Block Settings',
    description: 'Block specific IP addresses',
    group: 'shop',
    icon: ShieldBan,
    defaultValue: {},
  },
  {
    key: 'dns',
    path: '/admin/settings/dns',
    title: 'DNS Settings',
    description: 'DNS configuration and records',
    group: 'shop',
    icon: Server,
    defaultValue: {},
  },

  // Order Management
  {
    key: 'checkout',
    path: '/admin/settings/checkout',
    title: 'Checkout Settings',
    description: 'Checkout flow and payment options',
    group: 'orders',
    icon: ShoppingCart,
    defaultValue: {},
  },
  {
    key: 'order-otp',
    path: '/admin/settings/order-otp',
    title: 'Order OTP Settings',
    description: 'OTP verification for orders',
    group: 'orders',
    icon: KeyRound,
    defaultValue: {},
  },
  {
    key: 'stock',
    path: '/admin/settings/stock',
    title: 'Stock Settings',
    description: 'Inventory and stock management',
    group: 'orders',
    icon: Package,
    defaultValue: {},
  },
  {
    key: 'order-status',
    path: '/admin/settings/order-status',
    title: 'Order Status Settings',
    description: 'Custom order statuses and workflow',
    group: 'orders',
    icon: ListOrdered,
    defaultValue: {},
  },
  {
    key: 'order-label',
    path: '/admin/settings/order-label',
    title: 'Order Label Settings',
    description: 'Shipping labels and printing',
    group: 'orders',
    icon: Tag,
    defaultValue: {},
  },
  {
    key: 'invoice-template',
    path: '/admin/settings/invoice-template',
    title: 'Invoice Template',
    description: 'Invoice design and content',
    group: 'orders',
    icon: FileText,
    defaultValue: {},
  },

  // Integrations
  {
    key: 'facebook-pixel',
    path: '/admin/settings/facebook-pixel',
    title: 'Facebook Pixel',
    description: 'Facebook Pixel tracking setup',
    group: 'integrations',
    icon: Facebook,
    defaultValue: {},
  },
  {
    key: 'facebook-capi',
    path: '/admin/settings/facebook-capi',
    title: 'Conversion API',
    description: 'Facebook Conversion API setup',
    group: 'integrations',
    icon: Share2,
    defaultValue: {},
  },
  {
    key: 'tiktok-pixel',
    path: '/admin/settings/tiktok-pixel',
    title: 'TikTok Pixel',
    description: 'TikTok Pixel tracking setup',
    group: 'integrations',
    icon: BarChart3,
    defaultValue: {},
  },
  {
    key: 'gtm',
    path: '/admin/settings/gtm',
    title: 'Google Tag Manager',
    description: 'GTM container configuration',
    group: 'integrations',
    icon: Code,
    defaultValue: {},
  },
  {
    key: 'ga4',
    path: '/admin/settings/ga4',
    title: 'Google Analytics (GA4)',
    description: 'GA4 measurement setup',
    group: 'integrations',
    icon: BarChart3,
    defaultValue: {},
  },

  // Miscellaneous
  {
    key: 'gdpr',
    path: '/admin/settings/gdpr',
    title: 'GDPR Settings',
    description: 'Privacy and data protection',
    group: 'misc',
    icon: Shield,
    defaultValue: {},
  },
]

// Helper to get section config by key
export function getSettingsSectionByKey(key: string): SettingsSectionConfig | undefined {
  return SETTINGS_SECTIONS.find((section) => section.key === key)
}

// Helper to get default value for a key
export function getDefaultValueForKey(key: string): Record<string, unknown> {
  const section = getSettingsSectionByKey(key)
  return section?.defaultValue ?? {}
}

// Helper to get sections grouped by category
export function getSettingsSectionsByGroup(): Record<SettingsGroup, SettingsSectionConfig[]> {
  const grouped: Record<SettingsGroup, SettingsSectionConfig[]> = {
    shop: [],
    orders: [],
    integrations: [],
    misc: [],
  }

  for (const section of SETTINGS_SECTIONS) {
    grouped[section.group].push(section)
  }

  return grouped
}

// Helper to validate if a key is a valid settings section
export function isValidSettingsKey(key: string): key is SettingsSectionKey {
  return SETTINGS_SECTIONS.some((section) => section.key === key)
}

// ============================================
// Server-side Settings Fetchers
// ============================================

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
