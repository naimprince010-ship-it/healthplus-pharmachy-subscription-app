'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, FileText, Phone, ShoppingBag } from 'lucide-react'
import { HeroBannerSlider, type HeroBanner } from '@/components/HeroBannerSlider'
import { PrescriptionUploadModal } from '@/components/PrescriptionUploadModal'
import { SectionSlider } from '@/components/SectionSlider'
import { useCart } from '@/contexts/CartContext'
import { isPrescriptionFlowEnabled } from '@/lib/site-features'
import { trackWhatsAppClick } from '@/lib/trackEvent'

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
  freeDeliveryThreshold: number | null
}
const BENEFITS = ['ক্যাশ অন ডেলিভারি', 'বিকাশ', 'ঢাকায় একই দিনে', '১০০% অরিজিনাল']

function FreeDeliveryProgress({ threshold }: { threshold: number | null }) {
  const { total, isInitialized } = useCart()
  if (!isInitialized || !threshold || threshold <= 0 || total <= 0) return null
  const remaining = Math.max(0, threshold - total)
  const progress = Math.min(100, (total / threshold) * 100)
  return (
    <div className="border-b border-teal-100 bg-teal-50 px-4 py-3">
      <div className="mx-auto max-w-7xl">
        <div className="mb-1.5 flex items-center justify-between text-sm font-semibold text-[#0B4F4A]">
          <span>{remaining > 0 ? `আর ৳${Math.ceil(remaining)} কিনলেই ফ্রি ডেলিভারি` : 'আপনি ফ্রি ডেলিভারি পেয়েছেন!'}</span>
          <span>৳{threshold}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-teal-100" aria-label="Free delivery progress">
          <div className="h-full rounded-full bg-[#0F766E] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  )
}

function OfferHero({ offer }: { offer: HomeOffer | null }) {
  const [copied, setCopied] = useState(false)
  const copyCode = async () => {
    if (!offer) return
    await navigator.clipboard.writeText(offer.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="flex min-h-[330px] flex-col justify-center rounded-3xl bg-[#FFF1DF] p-10 xl:p-12">
      <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-[#C2410C] shadow-sm">নতুন কাস্টমার অফার</span>
      <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-tight text-[#0B4F4A] xl:text-5xl">
        {offer ? <>প্রথম অর্ডারে <span className="text-[#C2410C]">{offer.percentage}% ছাড়</span></> : '১০০% আসল ঔষধ ও কসমেটিক্স — এখন আপনার দরজায়'}
      </h1>
      {offer && (
        <div className="mt-6 flex w-fit items-center gap-3 rounded-xl border-2 border-dashed border-orange-300 bg-white/70 px-4 py-3">
          <span className="font-bold text-slate-800">কোড: {offer.code}</span>
          <button type="button" onClick={copyCode} className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-[#C2410C] shadow-sm" aria-label="কুপন কোড কপি করুন">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'কপি হয়েছে' : 'কপি'}
          </button>
        </div>
      )}
      <div className="mt-6 flex items-center gap-5">
        <Link href="/products" className="inline-flex min-h-11 items-center rounded-xl bg-[#C2410C] px-6 py-3 font-bold text-white shadow-sm transition hover:bg-orange-800">এখনই অর্ডার করুন</Link>
        <span className="text-sm font-medium text-[#0B4F4A]">ক্যাশ অন ডেলিভারি · ঢাকায় একই দিনে</span>
      </div>
    </div>
  )
}

export function DesktopHome({ homeSections, heroBanners = [], offer, hotline, whatsappNumber, freeDeliveryThreshold }: DesktopHomeProps) {
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState(false)
  const cleanWhatsApp = whatsappNumber.replace(/\D/g, '')
  return (
    <>
      <FreeDeliveryProgress threshold={freeDeliveryThreshold} />
      <section className="bg-white px-4 py-6">
        {heroBanners.length > 0 ? <HeroBannerSlider banners={heroBanners} interval={4500} /> : (
          <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
            <OfferHero offer={offer} />
            <div className="grid gap-5">
              {isPrescriptionFlowEnabled() && (
                <button type="button" onClick={() => setIsPrescriptionOpen(true)} className="flex min-h-[150px] flex-col items-start justify-center rounded-3xl bg-[#0F766E] p-7 text-left text-white shadow-sm">
                  <FileText className="mb-3 h-8 w-8" /><span className="text-xl font-bold">প্রেসক্রিপশন আপলোড</span><span className="mt-1 text-sm text-teal-100">ছবি দিন, আমরা অর্ডার তৈরি করব</span>
                </button>
              )}
              {(hotline || cleanWhatsApp) && (
                <div className="flex min-h-[150px] flex-col justify-center rounded-3xl border border-orange-100 bg-orange-50 p-7">
                  <div className="mb-3 flex items-center gap-2 text-[#C2410C]"><Phone className="h-7 w-7" /><span className="text-xl font-bold">কল বা WhatsApp-এ অর্ডার</span></div>
                  <div className="flex flex-wrap gap-2">
                    {hotline && <a href={`tel:${hotline}`} className="inline-flex min-h-11 items-center rounded-xl bg-[#C2410C] px-4 font-bold text-white">কল করুন</a>}
                    {cleanWhatsApp && <a href={`https://api.whatsapp.com/send?phone=${cleanWhatsApp}`} target="_blank" rel="noreferrer" onClick={() => trackWhatsAppClick('home_desktop_order_card')} className="inline-flex min-h-11 items-center rounded-xl border border-[#0F766E] bg-white px-4 font-bold text-[#0F766E]">WhatsApp</a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
      <section className="grid grid-cols-4 gap-3 bg-white px-4 pb-6">
        {BENEFITS.map((label) => <div key={label} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 px-3 text-sm font-bold text-[#0B4F4A]"><ShoppingBag className="h-4 w-4" />{label}</div>)}
      </section>
      <PrescriptionUploadModal isOpen={isPrescriptionOpen} onClose={() => setIsPrescriptionOpen(false)} />
      <div className="space-y-2 py-2 lg:space-y-1 lg:py-1">
        {homeSections.map(({ section, products }) => <SectionSlider key={section.id} section={section} products={products} />)}
      </div>
    </>
  )
}
