import type { ProductType } from '@prisma/client'

type VariantLite = {
  isDefault: boolean
  sizeLabel: string | null
  variantName: string
}

const UNCLEAR_PACK = /^\d*'?s?\s*pack$/i

function normalizeVolume(s: string): string {
  const t = s.trim().replace(/\s+/g, ' ')
  // Prefer readable spacing: "100ml" → "100 ml"
  return t.replace(/(\d+(?:\.\d+)?)(ml|g|kg|gm|l)\b/gi, (_, n, u) => `${n} ${u.toLowerCase()}`)
}

function isUnclearPackOrStripLabel(s: string): boolean {
  const x = s.trim()
  if (!x) return true
  if (UNCLEAR_PACK.test(x)) return true
  if (/^strip$/i.test(x) && x.length < 8) return false
  if (/\d+\s*'(s)?\s*pack/i.test(x) && !/\d+\s*(ml|g|kg|l)\b/i.test(x)) return true
  return false
}

function extractVolumeFromName(name: string): string | null {
  const m = name.match(/(\d+(?:\.\d+)?\s*(?:ml|mL|ML|g|gm|G|kg|L))\b/i)
  return m ? normalizeVolume(m[1]) : null
}

/**
 * Prefer real volume (ml/g) from sizeLabel, variant, or product name; avoid bare "1's Pack" when a volume exists in the title.
 */
export function getVolumeSizeDisplay(input: {
  name: string
  sizeLabel: string | null
  variantLabel: string | null
  unit: string
  variants: VariantLite[]
}): string | null {
  const fromName = extractVolumeFromName(input.name)
  const productSize = input.sizeLabel?.trim()
  if (productSize && !isUnclearPackOrStripLabel(productSize)) {
    return normalizeVolume(productSize)
  }
  const def = input.variants.find((v) => v.isDefault) || input.variants[0]
  const vSize = def?.sizeLabel?.trim()
  const vName = def?.variantName?.trim()
  if (vSize && !isUnclearPackOrStripLabel(vSize)) {
    return normalizeVolume(vSize)
  }
  if (fromName) return fromName
  if (vName && !isUnclearPackOrStripLabel(vName) && !UNCLEAR_PACK.test(vName)) {
    return normalizeVolume(vName)
  }
  if (input.variantLabel?.trim()) {
    return `${input.variantLabel.trim()} (${input.unit})`
  }
  if (productSize) return normalizeVolume(productSize)
  if (vName) return normalizeVolume(vName)
  return fromName
}

export function productTypeLabelBn(type: ProductType): string {
  return type === 'MEDICINE' ? 'ঔষধ' : 'সাধারণ পণ্য'
}

export function parseKeyFeatureLine(line: string): { title: string; detail: string } {
  const raw = line.trim()
  if (!raw) return { title: '', detail: '' }

  const colon = raw.indexOf(':')
  if (colon > 0 && colon < raw.length - 1) {
    return {
      title: raw.slice(0, colon).trim(),
      detail: raw.slice(colon + 1).trim(),
    }
  }
  for (const sep of [' | ', ' — ', ' - ', ' – ']) {
    const i = raw.indexOf(sep)
    if (i > 0 && i < raw.length - sep.length) {
      return {
        title: raw.slice(0, i).trim(),
        detail: raw.slice(i + sep.length).trim(),
      }
    }
  }
  return { title: raw, detail: '' }
}

export function parseIngredientsList(ingredients: string | null | undefined): string[] {
  if (!ingredients?.trim()) return []
  return ingredients
    .split(/[\n,،]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
