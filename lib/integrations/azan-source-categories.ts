import type { PrismaClient } from '@prisma/client'
import { generateUniqueSlug, slugify } from '@/lib/slugify'

type SourceFields = { sourceCategoryKey: string | null; sourceCategoryLabel: string | null }

/** Opt-in: create a local `Category` per unmapped Azan source name on sync. */
export function isAzanAutoCreateSourceCategoriesEnabled(): boolean {
  return process.env.AZAN_WHOLESALE_AUTO_CREATE_SOURCE_CATEGORIES === 'true'
}

/**
 * For each distinct `sourceCategoryKey` that has no row in `mappingByKey`, find
 * an existing category by name (case-insensitive) or create one. Returns a map
 * from normalized source key → `Category.id` and how many rows were created.
 */
export async function buildAutoSourceCategoryIdMap(
  prisma: PrismaClient,
  products: SourceFields[],
  mappingByKey: Map<string, string>
): Promise<{ bySourceKey: Map<string, string>; newCategoriesCreated: number }> {
  const byKey = new Map<string, string>()
  let newCategoriesCreated = 0

  const unique = new Map<string, string>()
  for (const p of products) {
    const k = p.sourceCategoryKey?.trim().toLowerCase()
    if (!k) continue
    if (mappingByKey.has(k)) continue
    const label = (p.sourceCategoryLabel || p.sourceCategoryKey || '').trim()
    if (!label) continue
    if (!unique.has(k)) unique.set(k, label)
  }

  for (const [key, displayName] of unique) {
    const { id, wasCreated } = await findOrCreateCategoryByDisplayName(prisma, displayName)
    if (wasCreated) newCategoriesCreated++
    byKey.set(key, id)
  }

  return { bySourceKey: byKey, newCategoriesCreated }
}

async function findOrCreateCategoryByDisplayName(
  prisma: PrismaClient,
  displayName: string
): Promise<{ id: string; wasCreated: boolean }> {
  const trimmed = displayName.trim()
  if (!trimmed) {
    throw new Error('findOrCreateCategoryByDisplayName: empty displayName')
  }

  const existing = await prisma.category.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true },
  })
  if (existing) {
    return { id: existing.id, wasCreated: false }
  }

  const baseText = slugify(trimmed) ? trimmed : 'imported-category'
  const uniqueSlug = await generateUniqueSlug(baseText, async (s) => {
    const c = await prisma.category.findUnique({ where: { slug: s } })
    return c !== null
  })

  const created = await prisma.category.create({
    data: {
      name: trimmed,
      slug: uniqueSlug,
      isActive: true,
      isMedicineCategory: false,
    },
    select: { id: true },
  })

  return { id: created.id, wasCreated: true }
}
