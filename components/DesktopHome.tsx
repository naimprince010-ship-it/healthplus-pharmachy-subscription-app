'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Banknote, Check, Copy, Lock, MessageCircle, ShieldCheck, Wallet } from 'lucide-react'
import { HeroBannerSlider, type HeroBanner } from '@/components/HeroBannerSlider'
import { SectionSlider } from '@/components/SectionSlider'
import { trackWhatsAppClick } from '@/lib/trackEvent'
import { BestSellerHomeSection, FlashSaleHomeSection, GroceryHomeSection, PopularBrandsSection, type CuratedHomeData } from '@/components/HomeCuratedSections'

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
  { label: '১০০% অরিজিনাল (ইমপোর্টেড)', icon: ShieldCheck },
  // TODO: Confirm the operational packaging policy before keeping this customer-facing claim.
  { label: 'গোপনীয় প্যাকেজিং', icon: Lock },
]
const SKIN_TYPES = ['তৈলাক্ত', 'শুষ্ক', 'মিশ্র', 'সংবেদনশীল', 'ব্রণপ্রবণ']

function OfferHero({ offer }: { offer: HomeOffer | null }) {
  const [copied, setCopied] = useState(false)
  const copyCode = async () => {
    if (!offer) return
    await navigator.clipboard.writeText(offer.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="flex min-h-[330px] flex-col justify-center rounded-3xl bg-[#FCE8EC] p-10 xl:p-12">
      <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#BE185D] shadow-sm">নতুন কাস্টমার অফার</span>
      <h1 className="mt-5 max-w-xl text-[32px] font-extrabold leading-snug text-[#0B4F4A] xl:text-[38px]">
        {offer ? <>প্রথম অর্ডারে <span className="text-[#BE185D]">{offer.percentage}% ছাড়</span></> : 'অরিজিনাল কসমেটিক্স আর দৈনন্দিন বাজার — এক জায়গায়'}
      </h1>
      {offer && (
        <div className="mt-6 flex w-fit items-center gap-3 rounded-xl border-2 border-dashed border-[#BE185D] bg-white/70 px-4 py-3">
          <span className="font-bold text-slate-800">কোড: {offer.code}</span>
          <button type="button" onClick={copyCode} className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-[#BE185D] shadow-sm" aria-label="কুপন কোড কপি করুন">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'কপি হয়েছে' : 'কপি'}
          </button>
        </div>
      )}
      <div className="mt-6 flex items-center gap-5">
        <Link href="/products" className="inline-flex min-h-11 items-center rounded-xl bg-[#C2410C] px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-800">এখনই কিনুন</Link>
        <span className="text-sm font-medium text-[#0B4F4A]">ক্যাশ অন ডেলিভারি · অরিজিনাল পণ্য</span>
      </div>
    </div>
  )
}

export function DesktopHome({ homeSections, heroBanners = [], offer, hotline, whatsappNumber, curated }: DesktopHomeProps) {
  const cleanWhatsApp = whatsappNumber.replace(/\D/g, '')
  const fallbackHero = <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
    <OfferHero offer={offer} />
    <div className="grid gap-5">
      {(hotline || cleanWhatsApp) && (
        <div className="flex h-full flex-col justify-center rounded-3xl border border-orange-100 bg-orange-50 p-7">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C2410C] text-white"><MessageCircle className="h-6 w-6" /></span>
          <span className="text-xl font-bold text-[#0B4F4A]">কল বা WhatsApp-এ অর্ডার</span>
          <span className="mt-1.5 text-sm leading-relaxed text-slate-600">অনলাইনে অর্ডার করতে অসুবিধা? প্রোডাক্টের নাম বা ছবি পাঠান, আমরা অর্ডার করে দেব।</span>
          <div className="mt-5 flex flex-wrap gap-2">
            {hotline && <a href={`tel:${hotline}`} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-[#C2410C] px-4 font-bold text-white">কল করুন</a>}
            {cleanWhatsApp && <a href={`https://api.whatsapp.com/send?phone=${cleanWhatsApp}`} target="_blank" rel="noreferrer" onClick={() => trackWhatsAppClick('home_desktop_order_card')} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-[#0F766E] bg-white px-4 font-bold text-[#0F766E]">WhatsApp</a>}
          </div>
        </div>
      )}
    </div>
  </div>
  return (
    <>
      <section className="bg-white px-4 py-6">
        {heroBanners.length > 0 ? <HeroBannerSlider banners={heroBanners} interval={4500} fallback={fallbackHero} /> : fallbackHero}
      </section>
      <section className="grid grid-cols-4 gap-3 bg-white px-4 pb-6">
        {BENEFITS.map(({ label, icon: Icon }) => <div key={label} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-3 text-sm font-bold text-[#0B4F4A]"><Icon className="h-4 w-4" />{label}</div>)}
      </section>
      <FlashSaleHomeSection products={curated.flashSale} />
      <section className="bg-white px-4 py-6"><h2 className="mb-3 text-xl font-bold text-[#0B4F4A]">আপনার স্কিন টাইপ অনুযায়ী</h2><div className="grid grid-cols-5 gap-3">{SKIN_TYPES.map((type) => <Link key={type} href={`/search?q=${encodeURIComponent(type)}`} className="flex min-h-16 items-center justify-center rounded-2xl border border-pink-100 bg-[#FCE8EC] px-3 font-bold text-[#BE185D]">{type}</Link>)}</div></section>
      <BestSellerHomeSection groups={curated.bestSellers} />
      <GroceryHomeSection products={curated.grocery} />
      <div className="space-y-2 py-2 lg:space-y-1 lg:py-1">
        {homeSections.map(({ section, products }) => <SectionSlider key={section.id} section={section} products={products} />)}
      </div>
      <PopularBrandsSection brands={curated.brands} />
    </>
  )
}
