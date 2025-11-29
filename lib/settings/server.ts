/**
 * Server-side Settings Helpers
 * 
 * This module provides server-side functions to fetch settings from the database.
 * Use these in API routes, server components, and backend logic.
 */

import { prisma } from '@/lib/prisma'
import {
  LoginSettings,
  OrderOtpSettings,
  FacebookPixelSettings,
  FacebookCapiSettings,
  TikTokPixelSettings,
  GTMSettings,
  GA4Settings,
  GdprSettings,
  DEFAULT_LOGIN_SETTINGS,
  DEFAULT_ORDER_OTP_SETTINGS,
  DEFAULT_FACEBOOK_PIXEL_SETTINGS,
  DEFAULT_FACEBOOK_CAPI_SETTINGS,
  DEFAULT_TIKTOK_PIXEL_SETTINGS,
  DEFAULT_GTM_SETTINGS,
  DEFAULT_GA4_SETTINGS,
  DEFAULT_GDPR_SETTINGS,
} from '@/lib/admin/settings'

/**
 * Fetch Login Settings from the database (server-side)
 * Returns default values if no settings exist
 */
export async function getLoginSettingsServer(): Promise<LoginSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'login' },
    })

    if (!setting) {
      return DEFAULT_LOGIN_SETTINGS
    }

    return {
      ...DEFAULT_LOGIN_SETTINGS,
      ...(setting.value as Partial<LoginSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch login settings:', error)
    return DEFAULT_LOGIN_SETTINGS
  }
}

/**
 * Fetch Order OTP Settings from the database (server-side)
 * Returns default values if no settings exist
 */
export async function getOrderOtpSettingsServer(): Promise<OrderOtpSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'order-otp' },
    })

    if (!setting) {
      return DEFAULT_ORDER_OTP_SETTINGS
    }

    return {
      ...DEFAULT_ORDER_OTP_SETTINGS,
      ...(setting.value as Partial<OrderOtpSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch order OTP settings:', error)
    return DEFAULT_ORDER_OTP_SETTINGS
  }
}

/**
 * Process Order OTP - called when an order event occurs
 * For now, this just logs the action. In the future, integrate with SMS gateway.
 * 
 * @param event - The order event that triggered this ('order_created' | 'order_confirmed')
 * @param orderData - Order information for template placeholders
 */
export async function processOrderOtp(
  event: 'order_created' | 'order_confirmed',
  orderData: {
    orderId: string
    amount: number
    customerName: string
    shippingPhone?: string
    billingPhone?: string
  }
): Promise<void> {
  try {
    const settings = await getOrderOtpSettingsServer()

    // Check if OTP is enabled and this event should trigger it
    if (!settings.enabled) {
      console.log('[Order OTP] OTP is disabled, skipping')
      return
    }

    if (!settings.sendOn.includes(event)) {
      console.log(`[Order OTP] Event "${event}" is not configured to send OTP, skipping`)
      return
    }

    // Get the phone number based on settings
    const phone = settings.phoneField === 'shipping_phone' 
      ? orderData.shippingPhone 
      : orderData.billingPhone

    if (!phone) {
      console.warn(`[Order OTP] No ${settings.phoneField} found for order ${orderData.orderId}`)
      return
    }

    // Process template placeholders
    const message = settings.smsTemplate
      .replace(/\{\{order_id\}\}/g, orderData.orderId)
      .replace(/\{\{amount\}\}/g, orderData.amount.toString())
      .replace(/\{\{customer_name\}\}/g, orderData.customerName)

    // For now, just log the action
    // TODO: Integrate with SMS gateway (e.g., Twilio, MSG91, etc.)
    console.log('[Order OTP] Would send OTP SMS:')
    console.log(`  - Event: ${event}`)
    console.log(`  - Phone: ${phone}`)
    console.log(`  - Message: ${message}`)
    console.log(`  - Order ID: ${orderData.orderId}`)

  } catch (error) {
    console.error('[Order OTP] Failed to process order OTP:', error)
    // Don't throw - OTP failure shouldn't break order flow
  }
}

// ============================================
// Phase 4: Tracking Settings Server Helpers
// ============================================

/**
 * Fetch Facebook Pixel Settings from the database (server-side)
 */
export async function getFacebookPixelSettingsServer(): Promise<FacebookPixelSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'facebook-pixel' },
    })
    if (!setting) {
      return DEFAULT_FACEBOOK_PIXEL_SETTINGS
    }
    return {
      ...DEFAULT_FACEBOOK_PIXEL_SETTINGS,
      ...(setting.value as Partial<FacebookPixelSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch Facebook Pixel settings:', error)
    return DEFAULT_FACEBOOK_PIXEL_SETTINGS
  }
}

/**
 * Fetch Facebook CAPI Settings from the database (server-side)
 */
export async function getFacebookCapiSettingsServer(): Promise<FacebookCapiSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'facebook-capi' },
    })
    if (!setting) {
      return DEFAULT_FACEBOOK_CAPI_SETTINGS
    }
    return {
      ...DEFAULT_FACEBOOK_CAPI_SETTINGS,
      ...(setting.value as Partial<FacebookCapiSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch Facebook CAPI settings:', error)
    return DEFAULT_FACEBOOK_CAPI_SETTINGS
  }
}

/**
 * Fetch TikTok Pixel Settings from the database (server-side)
 */
export async function getTikTokPixelSettingsServer(): Promise<TikTokPixelSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'tiktok-pixel' },
    })
    if (!setting) {
      return DEFAULT_TIKTOK_PIXEL_SETTINGS
    }
    return {
      ...DEFAULT_TIKTOK_PIXEL_SETTINGS,
      ...(setting.value as Partial<TikTokPixelSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch TikTok Pixel settings:', error)
    return DEFAULT_TIKTOK_PIXEL_SETTINGS
  }
}

/**
 * Fetch GTM Settings from the database (server-side)
 */
export async function getGTMSettingsServer(): Promise<GTMSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'gtm' },
    })
    if (!setting) {
      return DEFAULT_GTM_SETTINGS
    }
    return {
      ...DEFAULT_GTM_SETTINGS,
      ...(setting.value as Partial<GTMSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch GTM settings:', error)
    return DEFAULT_GTM_SETTINGS
  }
}

/**
 * Fetch GA4 Settings from the database (server-side)
 */
export async function getGA4SettingsServer(): Promise<GA4Settings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'ga4' },
    })
    if (!setting) {
      return DEFAULT_GA4_SETTINGS
    }
    return {
      ...DEFAULT_GA4_SETTINGS,
      ...(setting.value as Partial<GA4Settings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch GA4 settings:', error)
    return DEFAULT_GA4_SETTINGS
  }
}

/**
 * Fetch GDPR Settings from the database (server-side)
 */
export async function getGdprSettingsServer(): Promise<GdprSettings> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'gdpr' },
    })
    if (!setting) {
      return DEFAULT_GDPR_SETTINGS
    }
    return {
      ...DEFAULT_GDPR_SETTINGS,
      ...(setting.value as Partial<GdprSettings>),
    }
  } catch (error) {
    console.error('[Settings] Failed to fetch GDPR settings:', error)
    return DEFAULT_GDPR_SETTINGS
  }
}

/**
 * Fetch all tracking settings at once (for TrackingScripts component)
 */
export async function getAllTrackingSettingsServer() {
  const [fbPixel, tiktokPixel, gtm, ga4, gdpr] = await Promise.all([
    getFacebookPixelSettingsServer(),
    getTikTokPixelSettingsServer(),
    getGTMSettingsServer(),
    getGA4SettingsServer(),
    getGdprSettingsServer(),
  ])
  return { fbPixel, tiktokPixel, gtm, ga4, gdpr }
}
