/**
 * Turn plain product name mentions into markdown links `/products/[slug]`.
 * Used at generation time (runGeneration) and at render time (blog article page)
 * so catalog name ↔ prose mismatches still link when BlogProduct rows exist.
 */

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MIN_NEEDLE_LEN = 6

/** Variant strings to match AI prose vs DB catalog naming (parentheses, colons). */
export function collectNeedlesForProduct(name: string): string[] {
  const n = name.normalize('NFKC').trim().replace(/\s+/g, ' ')
  if (!n) return []

  const out: string[] = []
  const add = (s: string) => {
    const t = s.trim().replace(/\s+/g, ' ')
    if (!t || t.length < MIN_NEEDLE_LEN) return
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t)
  }

  add(n)

  // Strip trailing " (anything)" segments (pack size variants) repeatedly
  let stripped = n
  for (let i = 0; i < 4; i++) {
    const next = stripped.replace(/\s*\([^)]{1,120}\)\s*$/u, '').trim()
    if (next === stripped || next.length < MIN_NEEDLE_LEN) break
    stripped = next
    add(stripped)
  }

  // "Brand Product : Variant : SKU ..." → also try text before first colon (long titles)
  const colonSplit = /^(.{12,}?)\s*:\s*[\s\S]+/u.exec(n)
  if (colonSplit?.[1]) {
    const head = colonSplit[1].trim()
    add(head)
  }

  out.sort((a, b) => b.length - a.length)
  return out
}

function flattenNeedlesBySlug(
  products: Array<{ name: string; slug: string }>
): Array<{ slug: string; needle: string }> {
  const bySlug = new Map<string, string[]>()
  for (const p of products) {
    const slug = p.slug?.trim()
    const name = p.name?.trim()
    if (!slug || !name) continue
    const needles = collectNeedlesForProduct(name)
    if (!bySlug.has(slug)) bySlug.set(slug, [])
    const bucket = bySlug.get(slug)!
    for (const needle of needles) {
      if (!bucket.some((x) => x.toLowerCase() === needle.toLowerCase())) bucket.push(needle)
    }
  }
  const flat: Array<{ slug: string; needle: string }> = []
  for (const [slug, needles] of bySlug) {
    for (const needle of needles.sort((a, b) => b.length - a.length)) {
      flat.push({ slug, needle })
    }
  }
  flat.sort((a, b) => b.needle.length - a.needle.length)
  return flat
}

export function replaceFirstPlainMentionInLine(line: string, needle: string, slug: string): string {
  const lowerLine = line.toLowerCase()
  const lowerNeedle = needle.toLowerCase()
  let fromIdx = 0

  while (true) {
    const idx = lowerLine.indexOf(lowerNeedle, fromIdx)
    if (idx === -1) return line

    const linkMatches = [...line.matchAll(/\[[^\]]+\]\([^)]+\)/g)]
    const insideLink = linkMatches.some((m) => {
      const start = m.index ?? -1
      const end = start + m[0].length
      return idx >= start && idx < end
    })
    if (insideLink) {
      fromIdx = idx + lowerNeedle.length
      continue
    }

    const raw = line.slice(idx, idx + needle.length)
    const linked = `[${raw}](/products/${slug})`
    return `${line.slice(0, idx)}${linked}${line.slice(idx + needle.length)}`
  }
}

/** At most one link per product slug in the whole document (first matching needle wins per line traversal). */
export function linkProductMentionsInMarkdown(
  contentMd: string,
  products: Array<{ name: string; slug: string }>
): string {
  if (!contentMd || products.length === 0) return contentMd

  const sortedNeedles = flattenNeedlesBySlug(products)
  if (sortedNeedles.length === 0) return contentMd

  const lines = contentMd.split('\n')
  const linkedSlugs = new Set<string>()
  let insideCodeFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.trimStart().startsWith('```')) {
      insideCodeFence = !insideCodeFence
      continue
    }
    if (insideCodeFence || !line.trim()) continue

    let nextLine = line
    for (const { slug, needle } of sortedNeedles) {
      if (linkedSlugs.has(slug)) continue

      if (!new RegExp(escapeRegExp(needle), 'i').test(nextLine)) continue

      const replaced = replaceFirstPlainMentionInLine(nextLine, needle, slug)
      if (replaced !== nextLine) {
        nextLine = replaced
        linkedSlugs.add(slug)
      }
    }
    lines[i] = nextLine
  }

  return lines.join('\n')
}
