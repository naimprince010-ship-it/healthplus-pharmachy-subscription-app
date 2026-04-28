import { normalizeBDPhone } from '@/lib/utils'

/**
 * MIM SMS Integration Helper
 * 
 * Interacts with the MIM SMS gateway to send real mobile OTPs
 */

const MIM_SMS_API_KEY = process.env.MIM_SMS_API_KEY
const MIM_SMS_SENDER_ID = process.env.MIM_SMS_SENDER_ID
const MIM_SMS_API_URL = process.env.MIM_SMS_API_URL || 'https://api.mimsms.com/api/SmsSending/SMS'
const MIM_SMS_USERNAME = process.env.MIM_SMS_USERNAME

export interface SendSmsResult {
    ok: boolean
    error?: string
}

export async function sendMIMSMS(phone: string, message: string): Promise<SendSmsResult> {
    try {
        if (!MIM_SMS_API_KEY || !MIM_SMS_SENDER_ID || !MIM_SMS_USERNAME) {
            const err = 'Missing required env config: MIM_SMS_API_KEY, MIM_SMS_SENDER_ID, or MIM_SMS_USERNAME'
            console.error(`[MIM SMS] ${err}`)
            return { ok: false, error: err }
        }

        const normalizedPhone = normalizeBDPhone(phone)

        // MIM SMS API expects the 880 format usually, normalizeBDPhone returns +880
        const bdPhoneFormat = normalizedPhone.replace('+', '')

        const payload = {
            UserName: MIM_SMS_USERNAME,
            ApiKey: MIM_SMS_API_KEY,
            Apikey: MIM_SMS_API_KEY,
            MobileNumber: bdPhoneFormat,
            SenderName: MIM_SMS_SENDER_ID,
            SenderId: MIM_SMS_SENDER_ID,
            TransactionType: "T",
            Message: message,
        }

        console.log(`[MIM SMS Payload] Sending to ${MIM_SMS_API_URL}:`, { ...payload, ApiKey: '***' })

        const response = await fetch(
            MIM_SMS_API_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(payload),
            }
        );

        const textResponse = await response.text();

        // Let's print out the response to debug any issues precisely
        console.log(`[MIM SMS Raw Response] for ${bdPhoneFormat}:`, textResponse);

        if (response.ok && !textResponse.toLowerCase().includes('error') && !textResponse.toLowerCase().includes('invalid')) {
            console.log(`[MIM SMS] Successfully sending via JSON POST to ${bdPhoneFormat}.`)
            return { ok: true }
        } else {
            const reason = `Gateway rejected SMS. status=${response.status}, body=${textResponse.slice(0, 300)}`
            console.error(`[MIM SMS] ${reason}`)
            return { ok: false, error: reason }
        }
    } catch (error) {
        const reason = error instanceof Error ? error.message : 'Unknown network/execution error'
        console.error('[MIM SMS] Network or execution error while sending SMS:', error)
        return { ok: false, error: reason }
    }
}
