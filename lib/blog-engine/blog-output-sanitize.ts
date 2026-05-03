/**
 * Post-process blog AI JSON so meta fields fit Halalzi SEO bounds and stray model output is cleaned.
 */
import {
  clampSeoDescription,
  clampSeoTitle,
  dedupeSeoKeywords,
  normalizeWhitespace,
  SEO_TITLE_MAX_CHARS,
} from '@/lib/ai/product-helper-seo'

/** Shown article title — slightly wider than meta title. */
export const BLOG_DISPLAY_TITLE_MAX = 72
const SUMMARY_MAX = 220
const SUMMARY_MIN_SOFT = 100
const SEO_KEYWORDS_MAX_BLOG = 14

/** Injected into every writer user prompt — reduces hallucinated SKUs/prices/cert claims. */
export const BLOG_FIELD_ACCURACY_RULES = `
FIELD ACCURACY (mandatory — Halalzi editorial):
• Product **names**, **IDs**, and **৳ prices** in prose and JSON must match ONLY the Quick Reference lines or **searchProducts** tool results. Never invent IDs, packs, or prices.
• No false certifications or guarantees: do not claim FDA approval, doctor endorsement, halal stamps, “100% cure”, or fixed medical outcomes unless such text appeared in CONTEXT (normally it does not).
• Health/skincare: educational tone; for treatment concerns direct readers to appropriate professionals (e.g. dermatologist — “ডার্মাটোলজিস্ট বা চিকিৎসকের পরামর্শ”). No prescription drug dosing.
• Recipe costs / “monthly savings”: derive from cited catalogue prices where possible; if approximating use clear hedge words (e.g. “প্রায়”, “খরচ অনুযায়ী ভিন্ন হতে পারে”).
• **internalLinkSlugs**: copy slugs exactly from the provided list (character‑for‑character).
• **SEO**: seoTitle and seoDescription must honestly reflect the TOPIC — no misleading clickbait.
`

export function parseBlogEngineJson(raw: string): Record<string, unknown> {
  let s = raw.trim()
  const fenced = /^```(?:json)?\s*([\s\S]*?)```/im.exec(s)
  if (fenced) s = fenced[1].trim()
  try {
    return JSON.parse(s) as Record<string, unknown>
  } catch {
    const start = s.indexOf('{')
    const end = s.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(s.slice(start, end + 1)) as Record<string, unknown>
    }
    throw new Error('Blog engine returned invalid JSON')
  }
}

function splitKeywords(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => normalizeWhitespace(String(x))).filter(Boolean)
  }
  return String(raw || '')
    .split(/[,،]/)
    .map((x) => normalizeWhitespace(x))
    .filter(Boolean)
}

export function sanitizeBlogAiTextFields(input: {
  title?: unknown
  summary?: unknown
  seoTitle?: unknown
  seoDescription?: unknown
  seoKeywords?: unknown
}) {
  const titleBase = normalizeWhitespace(String(input.title ?? ''))
  const summaryBase = normalizeWhitespace(String(input.summary ?? ''))
  const seoTitleBase = normalizeWhitespace(String(input.seoTitle ?? input.title ?? ''))
  const seoDescBase = normalizeWhitespace(String(input.seoDescription ?? input.summary ?? ''))
  const kw = dedupeSeoKeywords(splitKeywords(input.seoKeywords), SEO_KEYWORDS_MAX_BLOG)

  return {
    title: clampSeoTitle(titleBase, BLOG_DISPLAY_TITLE_MAX),
    summary:
      [...summaryBase].length > SUMMARY_MAX
        ? clampSeoDescription(summaryBase, SUMMARY_MIN_SOFT, SUMMARY_MAX)
        : summaryBase,
    seoTitle: clampSeoTitle(seoTitleBase, SEO_TITLE_MAX_CHARS),
    seoDescription: clampSeoDescription(seoDescBase),
    seoKeywords: kw.join(', '),
  }
}

export function normalizeFaqPair(faq: { question?: unknown; answer?: unknown }) {
  return {
    question: normalizeWhitespace(String(faq.question ?? '')),
    answer: normalizeWhitespace(String(faq.answer ?? '')),
  }
}
