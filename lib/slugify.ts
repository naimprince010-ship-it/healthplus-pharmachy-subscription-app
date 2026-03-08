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
  const unitPattern = '(?:ml|mg|gm?|g|kg|pcs?|pack|piece|tablet|capsule|stick|sachet|softgel|iu|mcg|unit|wt|oz|L|ltr|mg\/ml|mcg\/ml)'
  const sizePattern = `(?:\\d+\\s*[x*]\\s*)?\\d+(?:\\.\\d+)?\\s*${unitPattern}`
  const combinedPattern = `${sizePattern}(?:\\s*\\+\\s*${sizePattern})*`
  const packSizeRegex = new RegExp(`(?:\\s+|-|\\(|^)${combinedPattern}\\s*\\)?\\s*$`, 'i')

  let cleaned = name.trim()

  // Clean common scraper noise first
  cleaned = cleaned
    .replace(/\d+%?\s*OFF/gi, '')
    .replace(/\d+-\d+\s*HOURS/gi, '')
    .replace(/৳\s*[\d,.]+/g, '')
    .replace(/Loading\s*ADD/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Apply pack size removal multiple times in case it's repeated
  let prevCleaned = ''
  while (cleaned !== prevCleaned) {
    prevCleaned = cleaned
    cleaned = cleaned.replace(packSizeRegex, '').trim()
  }

  return cleaned
}
