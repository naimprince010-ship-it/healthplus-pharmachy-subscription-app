import { normalizeBDPhone } from '@/lib/utils'

/**
 * MIM SMS Integration Helper
 * 
 * Interacts with the MIM SMS gateway to send real mobile OTPs
 */

const MIM_SMS_API_KEY = process.env.MIM_SMS_API_KEY || 'HGY5QT4ZBSD2ZXACDOZ0PXLEJ'
const MIM_SMS_SENDER_ID = process.env.MIM_SMS_SENDER_ID || '8809617623081'
const MIM_SMS_API_URL = process.env.MIM_SMS_API_URL || 'https://sms.mimsms.com/smsapi'

export async function sendMIMSMS(phone: string, message: string): Promise<boolean> {
  try {
    const normalizedPhone = normalizeBDPhone(phone)
    
    // MIM SMS API expects the 880 format usually, normalizeBDPhone returns +880
    const bdPhoneFormat = normalizedPhone.replace('+', '')

    const url = new URL(MIM_SMS_API_URL)
    url.searchParams.append('api_key', MIM_SMS_API_KEY)
    url.searchParams.append('type', 'text')
    url.searchParams.append('contacts', bdPhoneFormat)
    url.searchParams.append('senderid', MIM_SMS_SENDER_ID)
    url.searchParams.append('msg', message)

    const response = await fetch(url.toString(), {
      method: 'GET', // or POST according to MIM SMS documentation
    })

    const textResponse = await response.text()
    
    // MIM SMS typically returns a string like "SMS SUBMITTED: 123456" for success
    if (response.ok && !textResponse.toLowerCase().includes('error')) {
      console.log(`[MIM SMS] Successfully sent SMS to ${bdPhoneFormat}. Response: ${textResponse}`)
      return true
    } else {
      console.error(`[MIM SMS] Failed to send SMS to ${bdPhoneFormat}. Response: ${textResponse}`)
      return false
    }
  } catch (error) {
    console.error('[MIM SMS] Network or execution error while sending SMS:', error)
    return false
  }
}
