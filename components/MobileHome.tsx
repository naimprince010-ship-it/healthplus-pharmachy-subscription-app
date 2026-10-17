'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Banknote, Check, Copy, ShieldCheck, Wallet } from 'lucide-react'
import { HeroBannerSlider, type HeroBanner } from '@/components/HeroBannerSlider'
import { ProductCard, type ProductCardProps } from '@/components/ProductCard'
import { useCart } from '@/contexts/CartContext'
import type { HomeOffer } from '@/components/DesktopHome'
import { CategoryIconByKey } from '@/components/icons/CategoryIcons'
import type { CategoryIconKey } from '@/lib/category-icon-key'
import { BestSellerHomeSection, FlashSaleHomeSection, GroceryHomeSection, PopularBrandsSection, SectionHeader, SkinTypeHomeSection, type CuratedHomeData } from '@/components/HomeCuratedSections'

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
  { label: 'অরিজিনাল পণ্য', icon: ShieldCheck },
]
const CATEGORY_GRID: Array<{ label: string; iconKey: CategoryIconKey; href: string }> = [
  { label: 'মেকআপ', iconKey: 'makeup', href: '/category/makeup' },
  { label: 'স্কিনকেয়ার', iconKey: 'skincare', href: '/category/skin-care' },
  { label: 'হেয়ার', iconKey: 'hair', href: '/category/hair-care' },
  { label: 'ফ্র্যাগরেন্স', iconKey: 'fragrance', href: '/category/fragrance' },
  { label: 'বডি কেয়ার', iconKey: 'body', href: '/category/body-care' },
  { label: 'নারী যত্ন', iconKey: 'feminine', href: '/category/women-s-choice' },
  { label: 'গ্রোসারি', iconKey: 'grocery', href: '/products?category=grocery' },
  { label: 'অফার', iconKey: 'deals', href: '/flash-sale' },
]

function MobileCategoryGrid() {
  return (
    <section aria-label="ক্যাটাগরি" className="mx-4 mt-3 rounded-2xl bg-white p-3 md:mx-0">
      <div className="grid grid-cols-4 gap-1">
        {CATEGORY_GRID.map((cat) => (
          <Link key={cat.href} href={cat.href} className="flex min-h-11 flex-col items-center gap-1.5 rounded-xl px-1 pb-2 active:bg-teal-50">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
              <CategoryIconByKey iconKey={cat.iconKey} size={30} />
            </span>
            <span className="text-center text-xs font-semibold leading-tight text-gray-700">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function MobileOfferHero({ offer }: { offer: HomeOffer | null }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    if (!offer) return
    await navigator.clipboard.writeText(offer.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }
  return (
    <section className="relative min-h-[200px] overflow-hidden rounded-[20px] bg-[#FCE8EC] p-[18px]">
      {offer && <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#BE185D]">নতুন কাস্টমার অফার</span>}
      <h1 className={`${offer ? 'mt-4' : ''} max-w-full pr-[92px] text-[23px] font-bold leading-[1.25] text-[#0B4F4A]`}>
        {offer ? <>প্রথম অর্ডারে <span className="text-[#BE185D]">{offer.percentage}% ছাড়</span></> : 'অরিজিনাল কসমেটিক্স আর দৈনন্দিন বাজার'}
      </h1>
      {offer && <div className="mt-4 flex items-center justify-between rounded-xl border-2 border-dashed border-orange-300 bg-white/70 px-3 py-2">
        <span className="text-sm font-bold">কোড: {offer.code}</span>
        <button type="button" onClick={copy} className="flex min-h-11 min-w-[110px] items-center justify-center gap-1 rounded-lg bg-white px-3 text-xs font-bold text-[#C2410C]" aria-label="কুপন কোড কপি করুন" aria-live="polite">
          {copied ? <>কপি হয়েছে <Check className="h-4 w-4" /></> : <><Copy className="h-4 w-4" />কপি</>}
        </button>
      </div>}
      <Link href="/products" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-[#C2410C] px-4 font-bold text-white">এখনই কিনুন</Link>
      <p className="mt-3 text-center text-xs font-medium text-[#0B4F4A]">ক্যাশ অন ডেলিভারি · অরিজিনাল পণ্য</p>
      <span className="absolute right-3 top-3 flex h-24 w-24 items-center justify-center rounded-full bg-white/55" aria-hidden>
        <CategoryIconByKey iconKey="cosmetics" size={62} />
      </span>
    </section>
  )
}

function MobileFreeDeliveryProgress({ threshold, total }: { threshold: number; total: number }) {
  const remaining = Math.max(0, threshold - total)
  return <div className="fixed inset-x-0 z-40 flex h-9 items-center justify-center bg-teal-50 px-4 text-center text-xs font-bold text-[#0B4F4A] shadow-sm lg:hidden" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
    <span>{remaining ? `আর ৳${Math.ceil(remaining)} কিনলেই ফ্রি ডেলিভারি` : 'ফ্রি ডেলিভারি পাচ্ছেন ✓'}</span>
    <div className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-teal-100"><div className="h-full bg-[#0F766E]" style={{ width: `${Math.min(100, total / threshold * 100)}%` }} /></div>
  </div>
}

export function MobileHome({ homeSections, heroBanners = [], offer, freeDeliveryThreshold, curated }: MobileHomeProps) {
  const { total, isInitialized } = useCart()
  const showFreeDeliveryBar = Boolean(isInitialized && freeDeliveryThreshold && freeDeliveryThreshold > 0 && total > 0)
  return (
    <div className="min-h-screen bg-white" style={{ paddingBottom: showFreeDeliveryBar ? 'calc(172px + env(safe-area-inset-bottom))' : 'calc(136px + env(safe-area-inset-bottom))' }}>
      <section className="bg-white p-4 md:p-0 md:pb-4">
        {heroBanners.length > 0 ? <HeroBannerSlider banners={heroBanners} interval={4500} fallback={<MobileOfferHero offer={offer} />} /> : <MobileOfferHero offer={offer} />}
      </section>
      <div className="scrollbar-hide snap-x snap-mandatory overflow-x-auto bg-white px-3 py-3 md:px-0">
        <div className="flex min-w-max gap-2">{BENEFITS.map(({ label, icon: Icon }) => <div key={label} className="flex h-11 snap-start items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 text-xs font-bold text-[#0B4F4A]"><Icon className="h-4 w-4" />{label}</div>)}</div>
      </div>
      <MobileCategoryGrid />
      <FlashSaleHomeSection products={curated.flashSale} endsAt={curated.flashSaleEndsAt} serverNow={curated.serverNow} />
      <SkinTypeHomeSection skinTypes={curated.skinTypes} />
      <BestSellerHomeSection groups={curated.bestSellers} title={curated.bestSellerTitle} />
      <GroceryHomeSection products={curated.grocery} />
      {homeSections.map(({ section, products }, sectionIndex) => <section key={section.id} className="py-4">
        <div className="px-4 md:px-0"><SectionHeader title={section.title} subtitle={section.badgeText} href={`/sections/${section.slug}`} /></div>
        <div className="scrollbar-hide flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-2 pl-4 pr-8 md:grid md:grid-cols-4 md:gap-4 md:px-0">{products.slice(0, 10).map((product, productIndex) => <div key={product.id} className="w-[150px] flex-shrink-0 snap-start md:w-auto"><ProductCard imagePriority={sectionIndex === 0 && productIndex < 4} product={{ id: product.id, type: product.type || 'GENERAL', name: product.name, slug: product.slug, brandName: product.brandName || null, description: product.description || null, sellingPrice: product.sellingPrice, mrp: product.mrp || null, stockQuantity: product.stockQuantity || 100, imageUrl: product.imageUrl || null, discountPercentage: product.discountPercentage || null, flashSalePrice: product.flashSalePrice || null, flashSaleStart: product.flashSaleStart || null, flashSaleEnd: product.flashSaleEnd || null, isFlashSale: product.isFlashSale || null, sizeLabel: product.sizeLabel ?? null, packSize: product.packSize ?? null, category: product.category || { id: '', name: '', slug: '' } }} variant="compact" /></div>)}<Link href={`/sections/${section.slug}`} className="flex min-h-44 w-[120px] shrink-0 snap-start items-center justify-center rounded-2xl border border-teal-100 bg-white px-3 text-center text-sm font-bold text-[#0F766E] md:hidden">সব দেখুন →</Link></div>
      </section>)}
      <PopularBrandsSection brands={curated.brands} />
      {showFreeDeliveryBar && <MobileFreeDeliveryProgress threshold={freeDeliveryThreshold!} total={total} />}
    </div>
  )
}
