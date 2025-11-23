import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toFixed(2)}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-BD', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `ORD-${timestamp}-${random}`.toUpperCase()
}

export function calculateDiscount(price: number, discountPercent: number): number {
  return price * (discountPercent / 100)
}

export function applyMembershipDiscount(total: number, hasMembership: boolean): number {
  if (!hasMembership) return total
  return total - calculateDiscount(total, 10)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/
  return phoneRegex.test(phone)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Normalize Bangladeshi phone number to international format (+8801XXXXXXXXX)
 * Accepts: 01712345678, 8801712345678, +8801712345678
 * Returns: +8801712345678 or throws error if invalid
 */
export function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/\s+/g, '').trim()
  
  if (!isValidPhone(cleaned)) {
    throw new Error('Invalid phone number format. Use 01XXXXXXXXX, 8801XXXXXXXXX, or +8801XXXXXXXXX')
  }
  
  if (cleaned.startsWith('+880')) {
    return cleaned
  } else if (cleaned.startsWith('880')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('01')) {
    return `+88${cleaned}`
  }
  
  throw new Error('Invalid phone number format')
}

/**
 * Get active membership for a user
 * Returns the user's active membership if they have one that hasn't expired
 */
export async function getUserActiveMembership(userId: string) {
  const { prisma } = await import('@/lib/prisma')
  
  const membership = await prisma.userMembership.findFirst({
    where: {
      userId,
      isActive: true,
      endDate: { gte: new Date() },
    },
    include: {
      plan: true,
    },
  })

  return membership
}
