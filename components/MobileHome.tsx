'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Banknote, Check, Copy, Lock, ShieldCheck, Wallet } from 'lucide-react'
import { HeroBannerSlider, type HeroBanner } from '@/components/HeroBannerSlider'
import { ProductCard, type ProductCardProps } from '@/components/ProductCard'
import { useCart } from '@/contexts/CartContext'
import type { HomeOffer } from '@/components/DesktopHome'
import { BestSellerHomeSection, FlashSaleHomeSection, GroceryHomeSection, PopularBrandsSection, type CuratedHomeData } from '@/components/HomeCuratedSections'

interface HomeSection {
  section: { id: string; title: string; slug: string; badgeText: string | null; bgColor: string | null }
  products: ProductCardProps[]
}
interface MobileHomeProps {
  homeSections: HomeSection[]
  heroBanners?: HeroBanner[]
  offer: HomeOffer | null
  hotline: string
  freeDeliveryThreshold: number | null
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

function MobileOfferHero({ offer }: { offer: HomeOffer | null }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!offer) return
    await navigator.clipboard.writeText(offer.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <section className="m-3 min-h-[280px] rounded-3xl bg-[#FCE8EC] px-5 py-7">
      <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#BE185D]">নতুন কাস্টমার অফার</span>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight text-[#0B4F4A]">
        {offer ? <>প্রথম অর্ডারে <span className="text-[#BE185D]">{offer.percentage}% ছাড়</span></> : 'অরিজিনাল কসমেটিক্স আর দৈনন্দিন বাজার — এক জায়গায়'}
      </h1>
      {offer && <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-dashed border-orange-300 bg-white/70 px-3 py-2">
        <span className="text-sm font-bold">কোড: {offer.code}</span>
        <button type="button" onClick={copy} className="flex min-h-11 items-center gap-1 rounded-lg bg-white px-3 text-xs font-bold text-[#C2410C]" aria-label="কুপন কোড কপি করুন">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'হয়েছে' : 'কপি'}
        </button>
      </div>}
      <Link href="/products" className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#C2410C] px-4 font-bold text-white">এখনই কিনুন</Link>
      <p className="mt-3 text-center text-xs font-medium text-[#0B4F4A]">ক্যাশ অন ডেলিভারি · অরিজিনাল পণ্য</p>
    </section>
  )
}

function MobileFreeDeliveryProgress({ threshold }: { threshold: number | null }) {
  const { total, isInitialized } = useCart()
  if (!isInitialized || !threshold || threshold <= 0 || total <= 0) return null
  const remaining = Math.max(0, threshold - total)
  return <div className="fixed inset-x-0 bottom-16 z-30 border-y border-teal-100 bg-white px-4 py-2 shadow-sm">
    <div className="mb-1 flex justify-between text-xs font-bold text-[#0B4F4A]"><span>{remaining ? `আর ৳${Math.ceil(remaining)} কিনলেই ফ্রি ডেলিভারি` : 'ফ্রি ডেলিভারি পেয়েছেন!'}</span><span>৳{threshold}</span></div>
    <div className="h-1.5 overflow-hidden rounded-full bg-teal-100"><div className="h-full bg-[#0F766E]" style={{ width: `${Math.min(100, total / threshold * 100)}%` }} /></div>
  </div>
}

export function MobileHome({ homeSections, heroBanners = [], offer, freeDeliveryThreshold, curated }: MobileHomeProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {heroBanners.length > 0 ? <section className="bg-white p-3"><HeroBannerSlider banners={heroBanners} interval={4500} fallback={<MobileOfferHero offer={offer} />} /></section> : <MobileOfferHero offer={offer} />}
      <div className="scrollbar-hide overflow-x-auto bg-white px-3 py-3">
        <div className="flex min-w-max gap-2">{BENEFITS.map(({ label, icon: Icon }) => <div key={label} className="flex min-h-11 items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 text-xs font-bold text-[#0B4F4A]"><Icon className="h-4 w-4" />{label}</div>)}</div>
      </div>
      <FlashSaleHomeSection products={curated.flashSale} />
      <section className="py-4"><h2 className="mb-3 px-4 text-lg font-bold text-[#0B4F4A]">আপনার স্কিন টাইপ অনুযায়ী</h2><div className="scrollbar-hide flex gap-2 overflow-x-auto px-4">{SKIN_TYPES.map((type) => <Link key={type} href={`/search?q=${encodeURIComponent(type)}`} className="flex min-h-11 shrink-0 items-center rounded-full border border-pink-100 bg-[#FCE8EC] px-4 text-sm font-bold text-[#BE185D]">{type}</Link>)}</div></section>
      <BestSellerHomeSection groups={curated.bestSellers} />
      <GroceryHomeSection products={curated.grocery} />
      {homeSections.map(({ section, products }, sectionIndex) => <section key={section.id} className="py-4">
        <div className="mb-3 flex items-center justify-between px-4"><div><h2 className="text-lg font-bold text-gray-900">{section.title}</h2>{section.badgeText && <span className="mt-1 inline-block rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">{section.badgeText}</span>}</div><Link prefetch href={`/products?section=${section.slug}`} className="text-sm font-medium text-teal-600">সবগুলো →</Link></div>
        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2 pl-4 pr-8">{products.map((product, productIndex) => <div key={product.id} className="w-40 flex-shrink-0"><ProductCard imagePriority={sectionIndex === 0 && productIndex < 4} product={{ id: product.id, type: product.type || 'GENERAL', name: product.name, slug: product.slug, brandName: product.brandName || null, description: product.description || null, sellingPrice: product.sellingPrice, mrp: product.mrp || null, stockQuantity: product.stockQuantity || 100, imageUrl: product.imageUrl || null, discountPercentage: product.discountPercentage || null, flashSalePrice: product.flashSalePrice || null, flashSaleStart: product.flashSaleStart || null, flashSaleEnd: product.flashSaleEnd || null, isFlashSale: product.isFlashSale || null, sizeLabel: product.sizeLabel ?? null, packSize: product.packSize ?? null, category: product.category || { id: '', name: '', slug: '' } }} variant="compact" /></div>)}</div>
      </section>)}
      <PopularBrandsSection brands={curated.brands} />
      <MobileFreeDeliveryProgress threshold={freeDeliveryThreshold} />
      <div className="h-24" />
    </div>
  )
}
