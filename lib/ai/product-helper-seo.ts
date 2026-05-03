/** Post-process AI product helper output for Halalzi (Bangladesh storefront SEO). */

export const SEO_TITLE_MAX_CHARS = 60
export const SEO_DESC_TARGET_MIN = 148
export const SEO_DESC_TARGET_MAX = 160
export const SEO_KEYWORDS_MAX = 12

export function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** Meta title length cap (chars); truncation prefers a word boundary. */
export function clampSeoTitle(s: string, max = SEO_TITLE_MAX_CHARS): string {
  const t = normalizeWhitespace(s)
  if (!t) return t
  if ([...t].length <= max) return t
  const cutChars = [...t].slice(0, max).join('')
  const sp = cutChars.lastIndexOf(' ')
  const shortened =
    sp > Math.floor(max * 0.52) ? cutChars.slice(0, sp).trimEnd() : cutChars.trimEnd()
  const out = shortened.length > 0 ? shortened : cutChars.trimEnd()
  return out.length < [...t].length && !/[…]$/.test(out) ? `${out}…` : out
}

/** Meta description band suitable for snippets (char count approximation). */
export function clampSeoDescription(
  s: string,
  min = SEO_DESC_TARGET_MIN,
  max = SEO_DESC_TARGET_MAX
): string {
  const full = normalizeWhitespace(s)
  if (!full) return full
  const len = [...full].length
  if (len <= max) return full
  const cut = [...full].slice(0, max - 1).join('')
  const sp = cut.lastIndexOf(' ')
  const shortened =
    sp > Math.floor(min * 0.35) ? cut.slice(0, sp).trimEnd() : cut.trimEnd()
  const base = shortened.length > 0 ? shortened : cut.trimEnd()
  const suffix = base.length < len ? `${base}…` : base
  return normalizeWhitespace(suffix)
}

export function dedupeSeoKeywords(keywords: string[], max = SEO_KEYWORDS_MAX): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of keywords) {
    const k = normalizeWhitespace(raw)
    if (!k) continue
    const key = k.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(k)
    if (out.length >= max) break
  }
  return out
}

export function sanitizeAiProductPayload(data: {
  description: string
  keyFeatures: string[]
  specsSummary: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string[]
}) {
  return {
    description: normalizeWhitespace(data.description),
    specsSummary: normalizeWhitespace(data.specsSummary),
    seoTitle: clampSeoTitle(data.seoTitle),
    seoDescription: clampSeoDescription(data.seoDescription),
    seoKeywords: dedupeSeoKeywords(data.seoKeywords, SEO_KEYWORDS_MAX),
    keyFeatures: data.keyFeatures.map((f) => normalizeWhitespace(f)).filter(Boolean),
  }
}
