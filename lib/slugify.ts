export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export async function generateUniqueSlug(
  baseText: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = slugify(baseText)
  let slug = baseSlug
  let counter = 2

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}
export function cleanProductName(name: string): string {
  if (!name) return ''

  // Regex for pack sizes: 100ml, 500g, 10 PCS, 2x100mg, 150ml+50ml, etc.
  const unitPattern = '(?:ml|mg|gm?|g|kg|pcs?|pack|piece|tablet|capsule|stick|sachet|softgel|iu|mcg|unit|wt|oz)'
  const sizePattern = `(?:\\d+x)?\\d+\\s*${unitPattern}`
  const combinedPattern = `${sizePattern}(?:\\s*\\+\\s*${sizePattern})*`
  const packSizeRegex = new RegExp(`(?:\\s+|-|^)${combinedPattern}\\s*$`, 'i')

  let cleaned = name.trim()

  // Apply multiple times in case it's repeated (e.g. "Name 100ml 100ml")
  let prevCleaned = ''
  while (cleaned !== prevCleaned) {
    prevCleaned = cleaned
    cleaned = cleaned.replace(packSizeRegex, '').trim()
  }

  return cleaned
}
