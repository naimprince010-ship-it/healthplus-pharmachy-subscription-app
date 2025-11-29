/**
 * Admin Settings Types and API Helpers
 * 
 * This module provides TypeScript types for each settings section
 * and helper functions to interact with the unified settings API.
 */

import { z } from 'zod'

// ============================================
// Settings Types
// ============================================

export type BasicSettings = {
  storeName: string
  storePhone: string
  storeEmail: string
  storeAddress: string
}

export type BrandingSettings = {
  logoUrl: string | null
  faviconUrl: string | null
  primaryColor: string // hex like #0F766E
  secondaryColor: string // hex
}

export type ChargesSettings = {
  insideDhaka: number // BDT
  outsideDhaka: number // BDT
  codCharge: number // BDT
  minOrderAmount: number // BDT
}

export type CheckoutSettings = {
  allowGuestCheckout: boolean
  requiredFields: string[] // e.g. ["name", "phone", "address"]
  defaultPaymentMethod: 'cod' | 'online' | 'wallet'
}

export type LoginSettings = {
  enableOtpLogin: boolean // If true, show OTP login option
  enablePasswordLogin: boolean // If true, allow password-based login
  otpLoginMode: 'phone_only' | 'email_phone' // for future use
}

export type OrderOtpSettings = {
  enabled: boolean // send OTP SMS for orders?
  sendOn: ('order_created' | 'order_confirmed')[] // which events trigger OTP
  smsTemplate: string // e.g. "Your HealthPlus order {{order_id}}..."
  phoneField: 'shipping_phone' | 'billing_phone' // which phone to use
}

// Phase 4: Marketing/Tracking Integration Types
export type FacebookPixelSettings = {
  enabled: boolean
  pixelId: string
}

export type FacebookCapiSettings = {
  enabled: boolean
  accessToken: string
  testEventCode: string | null
}

export type TikTokPixelSettings = {
  enabled: boolean
  pixelId: string
}

export type GTMSettings = {
  enabled: boolean
  containerId: string // e.g. "GTM-XXXXX"
}

export type GA4Settings = {
  enabled: boolean
  measurementId: string // e.g. "G-XXXXXXXX"
}

export type GdprSettings = {
  cookieBannerEnabled: boolean
  cookieBannerText: string
  requireConsentForTracking: boolean
}

// ============================================
// Zod Schemas for Validation
// ============================================

export const basicSettingsSchema = z.object({
  storeName: z.string().min(1, 'Store name is required'),
  storePhone: z.string().min(1, 'Phone number is required'),
  storeEmail: z.string().email('Invalid email address'),
  storeAddress: z.string().min(1, 'Address is required'),
})

export const brandingSettingsSchema = z.object({
  logoUrl: z.string().nullable(),
  faviconUrl: z.string().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
})

export const chargesSettingsSchema = z.object({
  insideDhaka: z.number().min(0, 'Must be 0 or greater'),
  outsideDhaka: z.number().min(0, 'Must be 0 or greater'),
  codCharge: z.number().min(0, 'Must be 0 or greater'),
  minOrderAmount: z.number().min(0, 'Must be 0 or greater'),
})

export const checkoutSettingsSchema = z.object({
  allowGuestCheckout: z.boolean(),
  requiredFields: z.array(z.string()),
  defaultPaymentMethod: z.enum(['cod', 'online', 'wallet']),
})

export const loginSettingsSchema = z.object({
  enableOtpLogin: z.boolean(),
  enablePasswordLogin: z.boolean(),
  otpLoginMode: z.enum(['phone_only', 'email_phone']),
}).refine(
  (data) => data.enableOtpLogin || data.enablePasswordLogin,
  { message: 'At least one login method must remain enabled' }
)

export const orderOtpSettingsSchema = z.object({
  enabled: z.boolean(),
  sendOn: z.array(z.enum(['order_created', 'order_confirmed'])),
  smsTemplate: z.string(),
  phoneField: z.enum(['shipping_phone', 'billing_phone']),
}).refine(
  (data) => !data.enabled || (data.sendOn.length > 0 && data.smsTemplate.trim().length > 0),
  { message: 'When enabled, at least one event must be selected and SMS template must not be empty' }
)

// Phase 4: Marketing/Tracking Schemas
export const facebookPixelSettingsSchema = z.object({
  enabled: z.boolean(),
  pixelId: z.string(),
}).refine(
  (data) => !data.enabled || data.pixelId.trim().length > 0,
  { message: 'Pixel ID is required when Facebook Pixel is enabled' }
)

export const facebookCapiSettingsSchema = z.object({
  enabled: z.boolean(),
  accessToken: z.string(),
  testEventCode: z.string().nullable(),
}).refine(
  (data) => !data.enabled || data.accessToken.trim().length > 0,
  { message: 'Access Token is required when Facebook CAPI is enabled' }
)

export const tiktokPixelSettingsSchema = z.object({
  enabled: z.boolean(),
  pixelId: z.string(),
}).refine(
  (data) => !data.enabled || data.pixelId.trim().length > 0,
  { message: 'Pixel ID is required when TikTok Pixel is enabled' }
)

export const gtmSettingsSchema = z.object({
  enabled: z.boolean(),
  containerId: z.string(),
}).refine(
  (data) => !data.enabled || /^GTM-[A-Z0-9]+$/i.test(data.containerId),
  { message: 'Container ID must be in format GTM-XXXXX when GTM is enabled' }
)

export const ga4SettingsSchema = z.object({
  enabled: z.boolean(),
  measurementId: z.string(),
}).refine(
  (data) => !data.enabled || data.measurementId.startsWith('G-'),
  { message: 'Measurement ID must start with "G-" when GA4 is enabled' }
)

export const gdprSettingsSchema = z.object({
  cookieBannerEnabled: z.boolean(),
  cookieBannerText: z.string(),
  requireConsentForTracking: z.boolean(),
}).refine(
  (data) => !data.cookieBannerEnabled || data.cookieBannerText.trim().length > 0,
  { message: 'Cookie banner text is required when banner is enabled' }
)

// ============================================
// Default Values
// ============================================

export const DEFAULT_BASIC_SETTINGS: BasicSettings = {
  storeName: 'HealthPlus Pharmacy',
  storePhone: '',
  storeEmail: '',
  storeAddress: '',
}

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#0F766E', // teal-700
  secondaryColor: '#14B8A6', // teal-500
}

export const DEFAULT_CHARGES_SETTINGS: ChargesSettings = {
  insideDhaka: 60,
  outsideDhaka: 120,
  codCharge: 0,
  minOrderAmount: 0,
}

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  allowGuestCheckout: false,
  requiredFields: ['name', 'phone', 'address'],
  defaultPaymentMethod: 'cod',
}

export const DEFAULT_LOGIN_SETTINGS: LoginSettings = {
  enableOtpLogin: true,
  enablePasswordLogin: true,
  otpLoginMode: 'phone_only',
}

export const DEFAULT_ORDER_OTP_SETTINGS: OrderOtpSettings = {
  enabled: false,
  sendOn: ['order_confirmed'],
  smsTemplate: 'Your HealthPlus order {{order_id}} is confirmed. Amount: {{amount}} BDT. Thank you {{customer_name}}!',
  phoneField: 'shipping_phone',
}

// Phase 4: Marketing/Tracking Defaults
export const DEFAULT_FACEBOOK_PIXEL_SETTINGS: FacebookPixelSettings = {
  enabled: false,
  pixelId: '',
}

export const DEFAULT_FACEBOOK_CAPI_SETTINGS: FacebookCapiSettings = {
  enabled: false,
  accessToken: '',
  testEventCode: null,
}

export const DEFAULT_TIKTOK_PIXEL_SETTINGS: TikTokPixelSettings = {
  enabled: false,
  pixelId: '',
}

export const DEFAULT_GTM_SETTINGS: GTMSettings = {
  enabled: false,
  containerId: '',
}

export const DEFAULT_GA4_SETTINGS: GA4Settings = {
  enabled: false,
  measurementId: '',
}

export const DEFAULT_GDPR_SETTINGS: GdprSettings = {
  cookieBannerEnabled: true,
  cookieBannerText: 'We use cookies to improve your experience on HealthPlus.',
  requireConsentForTracking: true,
}

// ============================================
// API Helper Functions
// ============================================

/**
 * Fetch settings for a specific key
 */
export async function fetchSettings<T>(key: string): Promise<T> {
  const response = await fetch(`/api/admin/settings/${key}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Save settings for a specific key
 */
export async function saveSettings<T>(key: string, data: T): Promise<T> {
  const response = await fetch(`/api/admin/settings/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error(`Failed to save settings: ${response.statusText}`)
  }
  return response.json()
}

// ============================================
// Type Guards
// ============================================

export function isBasicSettings(data: unknown): data is BasicSettings {
  return basicSettingsSchema.safeParse(data).success
}

export function isBrandingSettings(data: unknown): data is BrandingSettings {
  return brandingSettingsSchema.safeParse(data).success
}

export function isChargesSettings(data: unknown): data is ChargesSettings {
  return chargesSettingsSchema.safeParse(data).success
}

export function isCheckoutSettings(data: unknown): data is CheckoutSettings {
  return checkoutSettingsSchema.safeParse(data).success
}

export function isLoginSettings(data: unknown): data is LoginSettings {
  return loginSettingsSchema.safeParse(data).success
}

export function isOrderOtpSettings(data: unknown): data is OrderOtpSettings {
  return orderOtpSettingsSchema.safeParse(data).success
}
