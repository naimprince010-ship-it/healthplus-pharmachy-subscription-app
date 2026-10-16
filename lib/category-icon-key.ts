/**
 * Maps a category (slug + display name, Bangla or English) to one of the
 * storefront category icons in `components/icons/CategoryIcons.tsx`.
 *
 * Order matters: more specific groups are checked first
 * (e.g. "baby skin care" → baby, "skin care" → skincare, "beauty" → cosmetics).
 * Keywords are matched as substrings of "slug name" (lower-cased), so avoid
 * very short words that appear inside other words (e.g. "men" ⊂ "women").
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

/** Exact slug matches for slugs too short/ambiguous for substring rules. */
const EXACT_SLUGS: Record<string, CategoryIconKey> = {
  men: 'cosmetics',
}

const RULES: Array<[CategoryIconKey, string[]]> = [
  ['prescription', ['prescription', 'rx', 'প্রেসক্রিপশন']],
  [
    'deals',
    ['deal', 'offer', 'sale', 'discount', 'b1g1', 'free', 'gift', 'blast', 'ramadan', 'eid', 'campaign',
      'অফার', 'ছাড়', 'ডিল', 'উপহার'],
  ],
  ['baby', ['baby', 'kid', 'mom', 'mother', 'diaper', 'বেবি', 'শিশু', 'মা ও', 'ডায়াপার']],
  [
    'medicine',
    ['medicine', 'medic', 'pharma', 'drug', 'otc', 'wellness', 'health',
      'tablet', 'capsule', 'syrup', 'injection', 'saline', 'rehydration', 'vitamin', 'supplement', 'mineral',
      'allerg', 'antihist', 'analges', 'antipyret', 'anesthe', 'antibiot', 'antimicro', 'antifung', 'antivir',
      'blood', 'cardio', 'heart', 'diabet', 'dermatolog', 'eye', 'fever', 'flu', 'gastr', 'antacid', 'ulcer',
      'liver', 'gynae', 'hormon', 'neuro', 'psychiat', 'nerve', 'opioid', 'pain', 'respirat', 'cough', 'asthma',
      'device', 'ঔষধ', 'ওষুধ', 'স্বাস্থ্য', 'ভিটামিন', 'ডায়াবেটিস'],
  ],
  [
    'skincare',
    ['skin', 'face', 'serum', 'sunscreen', 'personal', 'body care', 'body-care', 'cleanser', 'moisturiz', 'toner',
      'scrub', 'dental', 'oral care', 'sanitary', 'স্কিন', 'ত্বক', 'ফেস', 'পার্সোনাল'],
  ],
  [
    'cosmetics',
    ['cosmetic', 'makeup', 'make-up', 'beauty', 'lip', 'perfume', 'fragrance', 'hair', 'body spray', 'body-spray',
      'body mist', 'body-mist', 'deodorant', 'roll-on', 'nail', 'shave', 'groom', 'groming', 'women',
      'কসমেটিক', 'মেকআপ', 'সৌন্দর্য', 'পারফিউম'],
  ],
  ['fresh', ['fresh', 'fruit', 'vegetable', 'veg', 'organic', 'garden', 'ফল', 'সবজি', 'তাজা']],
  [
    'grocery',
    ['grocery', 'groceries', 'food', 'staple', 'bakery', 'breakfast', 'milk', 'juice', 'drink', 'cheese',
      'chocolate', 'household', 'home', 'laundry', 'dish', 'cleaner', 'tissue', 'napkin', 'paper', 'toilet',
      'গ্রোসারি', 'মুদি', 'খাদ্য'],
  ],
  ['all', ['all', 'সব']],
]

export function resolveCategoryIconKey(slug?: string | null, name?: string | null): CategoryIconKey {
  const s = (slug ?? '').toLowerCase().trim()
  if (EXACT_SLUGS[s]) return EXACT_SLUGS[s]
  const haystack = `${s} ${name ?? ''}`.toLowerCase()
  for (const [key, words] of RULES) {
    if (words.some((w) => haystack.includes(w))) return key
  }
  return 'all'
}
