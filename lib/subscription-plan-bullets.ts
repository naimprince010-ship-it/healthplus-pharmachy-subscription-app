import type { SubscriptionPlan } from '@prisma/client'

/** Bangla defaults when `itemsSummary` is empty (one bullet per line in DB). */
const DEFAULT_BULLETS_BN: Record<string, string[]> = {
  'family-pack': [
    'সব বয়সের জন্য প্রয়োজনীয় ওষুধ ও সাপ্লিমেন্ট',
    'মাসিক রিফিল ও ডেলিভারি রিমাইন্ডার',
    'পরিবারের জন্য বিশেষ মূল্য ও ছাড়',
  ],
  'baby-care-package': [
    'শিশুর জন্য নিরাপদ ওষুধ ও ভিটামিন',
    'পেডিয়াট্রিক ডোজ ও ব্যবহার নির্দেশিকা',
    'বৃদ্ধি ও রোগ প্রতিরোধ ক্ষমতায় সহায়তা',
  ],
  'bp-care-package': [
    'রক্তচাপ নিয়ন্ত্রণে প্রয়োজনীয় ওষুধ',
    'নিয়মিত ফলোআপ ও রিফিল সুবিধা',
    'হৃদস্বাস্থ্য সংক্রান্ত নির্দেশনা',
  ],
  'diabetes-care-package': [
    'ডায়াবেটিস পরিচালনার মূল ওষুধসমূহ',
    'সাপ্লিমেন্ট ও ব্লাড সুগার সাপোর্ট',
    'নিয়মিত সরবরাহ নিশ্চিত',
  ],
  _fallback: [
    'মাসিক হোম ডেলিভারি',
    'সাবস্ক্রাইবারদের বিশেষ ছাড়',
    'গ্রাহক সেবায় অগ্রাধিকার',
  ],
}

export function getSubscriptionPlanBullets(plan: SubscriptionPlan): string[] {
  const fromDb = plan.itemsSummary
    ?.split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (fromDb && fromDb.length > 0) {
    return fromDb.slice(0, 4)
  }
  return DEFAULT_BULLETS_BN[plan.slug] ?? DEFAULT_BULLETS_BN._fallback
}
