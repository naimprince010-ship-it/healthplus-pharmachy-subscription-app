import { z } from 'zod'

export const SUBSCRIPTIONS_PAGE_SETTING_KEY = 'subscriptionsPage'

export type SubscriptionsPageSettings = {
  heroBadgeBn: string
  heroTitleBn: string
  heroSubtitleBn: string
  trust1Bn: string
  trust2Bn: string
  trust3Bn: string
  whySectionTitleBn: string
  whySectionSubtitleBn: string
  why1TitleBn: string
  why1BodyBn: string
  why2TitleBn: string
  why2BodyBn: string
  why3TitleBn: string
  why3BodyBn: string
}

export const DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS: SubscriptionsPageSettings = {
  heroBadgeBn: 'মাসিক সাবস্ক্রিপশন',
  heroTitleBn: 'আপনার পরিবারের জন্য সঠিক প্ল্যান বেছে নিন',
  heroSubtitleBn:
    'প্রতি মাসে অটোমেটিক ডেলিভারি, গ্যারান্টিড স্টক এবং বিশেষ ছাড় উপভোগ করুন।',
  trust1Bn: '১০০% অথেনটিক ওষুধ',
  trust2Bn: 'যেকোনো সময় বাতিল করুন',
  trust3Bn: 'দ্রুত ডেলিভারি',
  whySectionTitleBn: 'কেন সাবস্ক্রাইব করবেন?',
  whySectionSubtitleBn: 'স্বাস্থ্যসেবা যেন আরও সহজ ও নির্ভরযোগ্য হয় — সেটাই আমাদের লক্ষ্য।',
  why1TitleBn: 'অটোমেটিক ডেলিভারি',
  why1BodyBn:
    'প্রতি মাসে নিজে থেকেই ওষুধ পৌঁছে যাবে — আবার আবার অর্ডার করার ঝামেলা নেই।',
  why2TitleBn: 'বিশেষ সাশ্রয়',
  why2BodyBn: 'সাবস্ক্রাইব করলে এক্সক্লুসিভ ছাড় ও মাসিক প্ল্যানে আরও সাশ্রয়।',
  why3TitleBn: 'স্টক নিশ্চিত',
  why3BodyBn:
    'সাবস্ক্রাইবাররা জনপ্রিয় ওষুধে অগ্রাধিকার পান — স্টক শেষ হওয়ার আগেই সরবরাহ।',
}

const nonempty = z.string().trim().min(1).max(2000)

export const subscriptionsPageSettingsSchema = z.object({
  heroBadgeBn: nonempty,
  heroTitleBn: nonempty,
  heroSubtitleBn: nonempty,
  trust1Bn: nonempty,
  trust2Bn: nonempty,
  trust3Bn: nonempty,
  whySectionTitleBn: nonempty,
  whySectionSubtitleBn: nonempty,
  why1TitleBn: nonempty,
  why1BodyBn: nonempty,
  why2TitleBn: nonempty,
  why2BodyBn: nonempty,
  why3TitleBn: nonempty,
  why3BodyBn: nonempty,
})

export function mergeSubscriptionsPageSettings(partial: unknown): SubscriptionsPageSettings {
  const merged = { ...DEFAULT_SUBSCRIPTIONS_PAGE_SETTINGS }
  if (!partial || typeof partial !== 'object') return merged
  const o = partial as Record<string, unknown>
  for (const k of Object.keys(merged) as (keyof SubscriptionsPageSettings)[]) {
    const v = o[k as string]
    if (typeof v === 'string' && v.trim().length > 0) {
      merged[k] = v.trim().slice(0, 2000)
    }
  }
  return merged
}
