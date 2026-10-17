'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Banknote, Check, Copy, MessageCircle, ShieldCheck, Wallet } from 'lucide-react'
import { HeroBannerSlider, type HeroBanner } from '@/components/HeroBannerSlider'
import { SectionSlider } from '@/components/SectionSlider'
import { trackWhatsAppClick } from '@/lib/trackEvent'
import { BestSellerHomeSection, FlashSaleHomeSection, GroceryHomeSection, PopularBrandsSection, SkinTypeHomeSection, type CuratedHomeData } from '@/components/HomeCuratedSections'
import { CategoryIconByKey } from '@/components/icons/CategoryIcons'

export interface HomeOffer { code: string; percentage: number }
interface HomeSection {
  section: { id: string; title: string; slug: string; badgeText: string | null; bgColor: string | null }
  products: import('@/components/ProductCard').ProductCardProps[]
}
interface DesktopHomeProps {
  homeSections: HomeSection[]
  heroBanners?: HeroBanner[]
  offer: HomeOffer | null
  hotline: string
  whatsappNumber: string
  curated: CuratedHomeData
}
const BENEFITS = [
  { label: 'ক্যাশ অন ডেলিভারি', icon: Banknote },
  { label: 'বিকাশ পেমেন্ট', icon: Wallet },
  { label: 'অরিজিনাল পণ্য', icon: ShieldCheck },
]

function OfferHero({ offer }: { offer: HomeOffer | null }) {
  const [copied, setCopied] = useState(false)
  const copyCode = async () => {
    if (!offer) return
    await navigator.clipboard.writeText(offer.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex min-h-[340px] items-center gap-4 overflow-hidden rounded-[22px] bg-[#FCE8EC] px-9 py-10">
      <div className="flex min-w-0 flex-[1_1_300px] flex-col justify-center">
      {offer && <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#BE185D] shadow-sm">নতুন কাস্টমার অফার</span>}
      <h1 className={`${offer ? 'mt-5' : ''} max-w-[460px] text-[38px] font-bold leading-[1.2] text-[#0B4F4A]`}>
        {offer ? <>প্রথম অর্ডারে <span className="text-[#BE185D]">{offer.percentage}% ছাড়</span></> : 'অরিজিনাল কসমেটিক্স আর দৈনন্দিন বাজার'}
      </h1>
      {offer && (
        <div className="mt-6 flex w-fit items-center gap-3 rounded-xl border-2 border-dashed border-[#BE185D] bg-white/70 px-4 py-3">
          <span className="font-bold text-slate-800">কোড: {offer.code}</span>
          <button type="button" onClick={copyCode} className="flex min-h-11 min-w-[126px] items-center justify-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-[#BE185D] shadow-sm" aria-label="কুপন কোড কপি করুন" aria-live="polite">
            {copied ? <>কপি হয়েছে <Check className="h-4 w-4" /></> : <><Copy className="h-4 w-4" />কপি</>}
          </button>
        </div>
      )}
      <div className="mt-6 flex items-center gap-5">
        <Link href="/products" className="inline-flex min-h-11 items-center rounded-xl bg-[#C2410C] px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-800">এখনই কিনুন</Link>
        <span className="text-sm font-medium text-[#0B4F4A]">ক্যাশ অন ডেলিভারি · অরিজিনাল পণ্য</span>
      </div>
      </div>
      <div className="relative flex h-[260px] flex-[1_1_220px] items-center justify-center" aria-hidden>
        <span className="absolute h-60 w-60 rounded-full bg-[#F9D3DD]" />
        <span className="relative -mr-8 mt-10 rotate-[-7deg]"><CategoryIconByKey iconKey="makeup" size={120} /></span>
        <span className="relative -ml-5 -mt-8 rotate-[6deg]"><CategoryIconByKey iconKey="fragrance" size={140} /></span>
      </div>
    </div>
  )
}

export function DesktopHome({ homeSections, heroBanners = [], offer, hotline, whatsappNumber, curated }: DesktopHomeProps) {
  const cleanWhatsApp = whatsappNumber.replace(/\D/g, '')
  const hasOrderContact = Boolean(hotline || cleanWhatsApp)
  const fallbackHero = <div className={hasOrderContact ? 'grid grid-cols-[minmax(0,1fr)_230px] gap-5' : ''}>
    <OfferHero offer={offer} />
    {hasOrderContact && <div className="grid gap-5">
      {(
        <div className="flex h-full flex-col justify-center rounded-3xl border border-orange-100 bg-orange-50 p-7">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2410C] text-white"><MessageCircle className="h-6 w-6" /></span>
          <span className="text-[19px] font-bold leading-snug text-[#0B4F4A]">কল বা <span className="whitespace-nowrap">WhatsApp-এ</span> অর্ডার</span>
          <span className="mt-1.5 text-sm leading-relaxed text-slate-600">অনলাইনে অর্ডার করতে অসুবিধা? প্রোডাক্টের নাম বা ছবি পাঠান, আমরা অর্ডার করে দেব।</span>
          <div className="mt-5 flex flex-wrap gap-2">
            {hotline && <a href={`tel:${hotline}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#C2410C] px-4 font-bold text-white">কল করুন</a>}
            {cleanWhatsApp && <a href={`https://api.whatsapp.com/send?phone=${cleanWhatsApp}`} target="_blank" rel="noreferrer" onClick={() => trackWhatsAppClick('home_desktop_order_card')} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#0F766E] bg-white px-4 font-bold text-[#0F766E]">WhatsApp</a>}
          </div>
        </div>
      )}
    </div>}
  </div>
  return (
    <>
      <section className="bg-white px-4 py-6">
        {heroBanners.length > 0 ? <HeroBannerSlider banners={heroBanners} interval={4500} fallback={fallbackHero} /> : fallbackHero}
      </section>
      <section className="grid grid-cols-3 gap-3 bg-white px-4 pb-6">
        {BENEFITS.map(({ label, icon: Icon }) => <div key={label} className="flex h-[72px] items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-3 text-sm font-bold text-[#0B4F4A]"><Icon className="h-4 w-4" />{label}</div>)}
      </section>
      <FlashSaleHomeSection products={curated.flashSale} />
      <SkinTypeHomeSection skinTypes={curated.skinTypes} />
      <BestSellerHomeSection groups={curated.bestSellers} />
      <GroceryHomeSection products={curated.grocery} />
      <div className="space-y-2 py-2 lg:space-y-1 lg:py-1">
        {homeSections.map(({ section, products }) => <SectionSlider key={section.id} section={section} products={products} />)}
      </div>
      <PopularBrandsSection brands={curated.brands} />
    </>
  )
}
