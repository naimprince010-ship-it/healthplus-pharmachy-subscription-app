/**
 * Maps a category (slug + display name, Bangla or English) to one of the
 * storefront category icons in `components/icons/CategoryIcons.tsx`.
 *
 * Order matters: more specific groups are checked first
 * (e.g. "baby skin care" → baby, "skin care" → skincare, "beauty" → cosmetics).
 */
export type CategoryIconKey =
  | 'all'
  | 'medicine'
  | 'prescription'
  | 'baby'
  | 'skincare'
  | 'cosmetics'
  | 'fresh'
  | 'grocery'
  | 'deals'

const RULES: Array<[CategoryIconKey, string[]]> = [
  ['prescription', ['prescription', 'rx', 'প্রেসক্রিপশন']],
  ['deals', ['deal', 'offer', 'sale', 'discount', 'অফার', 'ছাড়', 'ডিল']],
  ['baby', ['baby', 'kid', 'mom', 'mother', 'diaper', 'বেবি', 'শিশু', 'মা ও', 'ডায়াপার']],
  ['medicine', ['medicine', 'medic', 'pharma', 'drug', 'otc', 'wellness', 'health', 'ঔষধ', 'ওষুধ', 'স্বাস্থ্য']],
  ['skincare', ['skin', 'face', 'serum', 'sunscreen', 'স্কিন', 'ত্বক', 'ফেস']],
  ['cosmetics', ['cosmetic', 'makeup', 'make-up', 'beauty', 'lip', 'perfume', 'fragrance', 'hair', 'কসমেটিক', 'মেকআপ', 'সৌন্দর্য', 'পারফিউম']],
  ['fresh', ['fresh', 'fruit', 'vegetable', 'veg', 'ফল', 'সবজি', 'তাজা']],
  ['grocery', ['grocery', 'groceries', 'food', 'staple', 'গ্রোসারি', 'মুদি', 'খাদ্য']],
  ['all', ['all', 'সব']],
]

export function resolveCategoryIconKey(slug?: string | null, name?: string | null): CategoryIconKey {
  const haystack = `${slug ?? ''} ${name ?? ''}`.toLowerCase()
  for (const [key, words] of RULES) {
    if (words.some((w) => haystack.includes(w))) return key
  }
  return 'all'
}
