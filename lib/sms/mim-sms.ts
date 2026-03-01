import { normalizeBDPhone } from '@/lib/utils'

/**
 * MIM SMS Integration Helper
 * 
 * Interacts with the MIM SMS gateway to send real mobile OTPs
 */

const MIM_SMS_API_KEY = process.env.MIM_SMS_API_KEY || 'HGY5QT4ZRSDZ2XAODOZ0PXLEJ'
const MIM_SMS_SENDER_ID = process.env.MIM_SMS_SENDER_ID || '8809617623081'
const MIM_SMS_API_URL = process.env.MIM_SMS_API_URL || 'https://api.mimsms.com/api/SmsSending/Send'
// We also need the username which the API requires
const MIM_SMS_USERNAME = process.env.MIM_SMS_USERNAME || 'naimprince010@gmail.com'

export async function sendMIMSMS(phone: string, message: string): Promise<boolean> {
    try {
        const normalizedPhone = normalizeBDPhone(phone)

        // MIM SMS API expects the 880 format usually, normalizeBDPhone returns +880
        const bdPhoneFormat = normalizedPhone.replace('+', '')

        const url = new URL(MIM_SMS_API_URL)
        url.searchParams.append('UserName', MIM_SMS_USERNAME)
        url.searchParams.append('Apikey', MIM_SMS_API_KEY)
        url.searchParams.append('MobileNumber', bdPhoneFormat)
        url.searchParams.append('SenderName', MIM_SMS_SENDER_ID)
        url.searchParams.append('TransactionType', 'T')
        url.searchParams.append('Message', message)

        const response = await fetch(url.toString(), {
            method: 'GET',
        })

        const textResponse = await response.text()

        // If response is OK and doesn't contain error keywords (or if we can parse a success JSON)
        if (response.ok && !textResponse.toLowerCase().includes('error') && !textResponse.toLowerCase().includes('invalid')) {
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
