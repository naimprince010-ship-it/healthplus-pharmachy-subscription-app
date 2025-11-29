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
  DEFAULT_LOGIN_SETTINGS,
  DEFAULT_ORDER_OTP_SETTINGS,
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
