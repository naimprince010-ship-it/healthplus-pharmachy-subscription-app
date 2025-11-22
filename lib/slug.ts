/**
 * Slug generation utility for medicines and other entities
 * Generates URL-friendly slugs with collision handling
 */

import { prisma } from './prisma'

/**
 * Generate a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug for a medicine
 * Handles collisions by appending -2, -3, etc.
 * @param name - The medicine name
 * @param excludeId - Optional ID to exclude from uniqueness check (for updates)
 * @returns A unique slug
 */
export async function generateUniqueMedicineSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = generateSlug(name)
  let slug = baseSlug
  let counter = 2

  while (true) {
    const existing = await prisma.medicine.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    })

    if (!existing) {
      break
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Validate if a slug is available
 * @param slug - The slug to check
 * @param excludeId - Optional ID to exclude from check
 * @returns True if slug is available
 */
export async function isMedicineSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await prisma.medicine.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  return !existing
}
