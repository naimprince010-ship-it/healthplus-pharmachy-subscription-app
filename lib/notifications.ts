type NotificationTemplate = 
  | 'OTP'
  | 'PRESCRIPTION_RECEIVED'
  | 'ORDER_CONFIRMED'
  | 'MEMBERSHIP_EXPIRING'
  | 'DELIVERY_REMINDER'

interface NotificationData {
  [key: string]: string | number
}

const SMS_TEMPLATES: Record<NotificationTemplate, (data: NotificationData) => string> = {
  OTP: (data) => `Your HealthPlus OTP is: ${data.otp}. Valid for 10 minutes.`,
  PRESCRIPTION_RECEIVED: (data) => `Dear ${data.name}, we received your prescription. Our team will contact you soon. - HealthPlus`,
  ORDER_CONFIRMED: (data) => `Order ${data.orderNumber} confirmed! Total: ৳${data.total}. Delivery in ${data.days} days. - HealthPlus`,
  MEMBERSHIP_EXPIRING: (data) => `Dear ${data.name}, your HealthPlus membership expires on ${data.expiryDate}. Renew now to keep your 10% discount!`,
  DELIVERY_REMINDER: (data) => `Your order ${data.orderNumber} will be delivered today. Please be available. - HealthPlus`
}

const EMAIL_TEMPLATES: Record<NotificationTemplate, (data: NotificationData) => { subject: string; body: string }> = {
  OTP: (data) => ({
    subject: 'Your HealthPlus OTP Code',
    body: `
      <h2>Your OTP Code</h2>
      <p>Your one-time password is: <strong>${data.otp}</strong></p>
      <p>This code is valid for 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `
  }),
  PRESCRIPTION_RECEIVED: (data) => ({
    subject: 'Prescription Received - HealthPlus',
    body: `
      <h2>Prescription Received</h2>
      <p>Dear ${data.name},</p>
      <p>We have received your prescription successfully. Our pharmacy team will review it and contact you shortly.</p>
      <p>Thank you for choosing HealthPlus!</p>
    `
  }),
  ORDER_CONFIRMED: (data) => ({
    subject: `Order Confirmed - ${data.orderNumber}`,
    body: `
      <h2>Order Confirmed</h2>
      <p>Dear ${data.name},</p>
      <p>Your order <strong>${data.orderNumber}</strong> has been confirmed!</p>
      <p><strong>Total Amount:</strong> ৳${data.total}</p>
      <p><strong>Estimated Delivery:</strong> ${data.days} days</p>
      <p>Thank you for shopping with HealthPlus!</p>
    `
  }),
  MEMBERSHIP_EXPIRING: (data) => ({
    subject: 'Your Membership is Expiring Soon',
    body: `
      <h2>Membership Expiring</h2>
      <p>Dear ${data.name},</p>
      <p>Your HealthPlus membership will expire on <strong>${data.expiryDate}</strong>.</p>
      <p>Renew now to continue enjoying your 10% discount on all medicines!</p>
      <p><a href="${data.renewUrl}">Renew Membership</a></p>
    `
  }),
  DELIVERY_REMINDER: (data) => ({
    subject: `Delivery Today - Order ${data.orderNumber}`,
    body: `
      <h2>Delivery Reminder</h2>
      <p>Dear ${data.name},</p>
      <p>Your order <strong>${data.orderNumber}</strong> will be delivered today.</p>
      <p>Please ensure someone is available to receive the delivery.</p>
      <p>Thank you for choosing HealthPlus!</p>
    `
  })
}

export async function sendSMS(to: string, template: NotificationTemplate, data: NotificationData): Promise<boolean> {
  try {
    const message = SMS_TEMPLATES[template](data)
    
    console.log(`[SMS] To: ${to}, Message: ${message}`)
    
    
    return true
  } catch (error) {
    console.error('SMS sending failed:', error)
    return false
  }
}

export async function sendEmail(to: string, template: NotificationTemplate, data: NotificationData): Promise<boolean> {
  try {
    const { subject } = EMAIL_TEMPLATES[template](data)
    
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`)
    
    
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export async function sendOTP(phone: string, otp: string): Promise<boolean> {
  return sendSMS(phone, 'OTP', { otp })
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
