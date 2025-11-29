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
