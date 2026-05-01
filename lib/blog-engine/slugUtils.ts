// Bug #3 fix: Bangla ও অন্যান্য non-ASCII characters সহ slug তৈরি করা
// আগের \w regex Bangla মুছে ফেলত — এখন transliteration ব্যবহার করা হয়েছে

const BANGLA_TO_LATIN: Record<string, string> = {
  'অ': 'a', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh',
  'স': 's', 'হ': 'h', 'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
  'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
  'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', '্': '',
  '়': '', 'ৃ': 'ri',
}

function transliterateBangla(text: string): string {
  let result = ''
  for (const char of text) {
    if (BANGLA_TO_LATIN[char] !== undefined) {
      result += BANGLA_TO_LATIN[char]
    } else {
      result += char
    }
  }
  return result
}

export function generateSlug(title: string): string {
  const date = new Date()
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  // Bangla transliterate করো, তারপর ASCII-safe slug বানাও
  const transliterated = transliterateBangla(title)

  const slug = transliterated
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')   // এখন Bangla আগেই convert হয়ে গেছে
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)

  // যদি slug সম্পূর্ণ empty হয়ে যায়, random fallback দাও
  const safeSlug = slug || `blog-${Date.now().toString(36)}`

  return `${safeSlug}-${dateStr}`
}

// Slug collision হলে unique suffix যোগ করো
export function makeUniqueSlug(baseSlug: string): string {
  return `${baseSlug}-${Date.now().toString(36)}`
}
