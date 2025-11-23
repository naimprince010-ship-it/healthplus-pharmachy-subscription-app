/**
 * Server-only membership utilities
 * This file contains functions that require database access and should only be used in:
 * - API routes
 * - Server Components
 * - Server Actions
 * 
 * DO NOT import this file in Client Components
 */

import { prisma } from '@/lib/prisma'

/**
 * Get active membership for a user
 * Returns the user's active membership if they have one that hasn't expired
 */
export async function getUserActiveMembership(userId: string) {
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
