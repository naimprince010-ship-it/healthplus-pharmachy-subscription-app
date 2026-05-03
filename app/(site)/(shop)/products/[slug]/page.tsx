import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/ProductDetailClient'
import { ProductReviews } from '@/components/ProductReviews'
import { GenericAlternatives } from '@/components/GenericAlternatives'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import { isProductLinkedToAzanCatalog } from '@/lib/integrations/azan-catalog'
import { getStorefrontImageUrl } from '@/lib/image-url'
import { serializeJsonLd } from '@/lib/serialize-json-ld'
import { getCachedProductBySlug } from './get-product-by-slug'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'
import { SimilarProductsSection } from './SimilarProductsSection'
import { ProductSpecsTable } from '@/components/product-detail/ProductSpecsTable'
import { ProductKeyFeaturesGrid } from '@/components/product-detail/ProductKeyFeaturesGrid'
import { ProductIngredientsSection } from '@/components/product-detail/ProductIngredientsSection'
import { getVolumeSizeDisplay, productTypeLabelBn } from '@/lib/product-detail-display'

export const runtime = 'nodejs'
export const revalidate = 60 // Revalidate page every 60 seconds (ISR)

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const product = await getCachedProductBySlug(slug)

    if (!product) {
      return {}
    }

    const categoryName = product.category?.name || ''
    const shouldHideCategoryInSeoTitle = categoryName.trim().toLowerCase() === 'azan wholesale'
    const safeCategorySuffix = categoryName && !shouldHideCategoryInSeoTitle ? ` - ${categoryName}` : ''
    const seoTitle = product.seoTitle || `${product.name}${safeCategorySuffix} | Halalzi`
    const seoDescription = product.seoDescription || product.description || `Buy ${product.name} online at best price from Halalzi. Fast delivery across Bangladesh.`

    const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com').replace(/\/$/, '')
    let ogImage = product.imageUrl ? getStorefrontImageUrl(product.imageUrl) : null
    if (ogImage && ogImage.startsWith('/')) {
      ogImage = `${siteBase}${ogImage}`
    }

    return {
      title: seoTitle,
      description: seoDescription,
      keywords: product.seoKeywords || undefined,
      alternates: {
        canonical: `/products/${slug}`,
      },
      openGraph: {
        title: seoTitle,
        description: seoDescription,
        url: `${siteBase}/products/${slug}`,
        siteName: 'Halalzi',
        type: 'website',
        images: ogImage ? [ogImage] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getCachedProductBySlug(slug)

  if (!product || !product.isActive) {
    notFound()
  }

  if (!isMedicineShopEnabled() && product.type === 'MEDICINE') {
    notFound()
  }
  if (!isGroceryShopEnabled() && product.category?.slug === GROCERY_CATEGORY_SLUG) {
    notFound()
  }

  const sellingPrice = Number(product.sellingPrice)
  const mrp = product.mrp ? Number(product.mrp) : null
  const stockQuantity = Number(product.stockQuantity)
  // Use product's discountPercentage, or fall back to linked medicine's discountPercentage
  const rawDiscount = product.discountPercentage || product.medicine?.discountPercentage
  const discountPercentage = rawDiscount ? Number(rawDiscount) : null

  // Map variants for client component (convert Prisma types to plain numbers)
  const variants = (product.variants || []).map((v: any) => ({
    id: v.id,
    variantName: v.variantName,
    unitLabel: v.unitLabel || `/${v.variantName}`,
    sizeLabel: v.sizeLabel,
    mrp: v.mrp != null ? Number(v.mrp) : null,
    sellingPrice: Number(v.sellingPrice),
    discountPercentage: v.discountPercentage != null ? Number(v.discountPercentage) : null,
    stockQuantity: Number(v.stockQuantity),
    isDefault: v.isDefault,
  }))

  // Get medicine-specific info for MedEasy-style display
  const isMedicine = product.type === 'MEDICINE'
  const genericName = product.medicine?.genericName || null
  const dosageForm = product.medicine?.dosageForm || null
  const strength = product.medicine?.strength || product.sizeLabel || null
  // Use Manufacturer relation first, then fall back to medicine.manufacturer or brandName
  const manufacturerName = product.manufacturer?.name || product.medicine?.manufacturer || product.brandName || null
  const manufacturerSlug = product.manufacturer?.slug || null

  const volumeDisplay = getVolumeSizeDisplay({
    name: product.name,
    sizeLabel: product.sizeLabel,
    variantLabel: product.variantLabel,
    unit: product.unit,
    variants: (product.variants || []).map((v: { isDefault: boolean; sizeLabel: string | null; variantName: string }) => ({
      isDefault: v.isDefault,
      sizeLabel: v.sizeLabel,
      variantName: v.variantName,
    })),
  })
  const strengthNorm = strength?.trim().toLowerCase() ?? ''
  const volumeNorm = volumeDisplay?.trim().toLowerCase() ?? ''
  const volumeSameAsStrength = Boolean(strengthNorm && volumeNorm && strengthNorm === volumeNorm)
  const showStrengthBesideTitle =
    !!strength &&
    !product.name.toLowerCase().includes(strength.toLowerCase()) &&
    !volumeSameAsStrength

  // Parent/Leaf category for MedEasy-style display
  // Line 1 (grey): Parent category/department (e.g., "Women's Choice") OR dosage form for medicines
  // Line 2 (green link): Leaf category (e.g., "Sanitary Napkin") OR generic name for medicines
  const parentCategoryName = product.category?.parentCategory?.name || null
  const leafCategoryName = product.category?.name || null
  const leafCategorySlug = product.category?.slug || null
  const isAzanCatalogProduct = isProductLinkedToAzanCatalog({
    supplierSku: product.supplierSku,
    sourceCategoryName: product.sourceCategoryName,
    category: { name: product.category?.name ?? '' },
  })
  const customerFacingLeafLabel = isAzanCatalogProduct ? 'Verified by Halalzi' : leafCategoryName
  const displayImageUrl = getStorefrontImageUrl(product.imageUrl)
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL || 'https://halalzi.com').replace(/\/$/, '')
  const shortShareUrl = `${siteBase}/p/${product.id}`

  // Top line text: dosage form (for medicines) OR parent department (for general products with hierarchy)
  const topLineText = isMedicine ? dosageForm : parentCategoryName

  // Normalize for comparison to avoid duplicates from whitespace/casing differences
  const normalizedTop = topLineText?.trim().toLowerCase() || ''
  const normalizedLeaf = leafCategoryName?.trim().toLowerCase() || ''
  const showTopLine = !!topLineText && normalizedTop !== normalizedLeaf

  // Generate JSON-LD structured data for SEO
  let jsonLdImageUrl = displayImageUrl || 'https://halalzi.com/images/default-product.png'
  if (jsonLdImageUrl.startsWith('/')) {
    jsonLdImageUrl = `${siteBase}${jsonLdImageUrl}`
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Buy online at best price`,
    image: jsonLdImageUrl,
    sku: product.id,
    brand: product.manufacturer?.name || product.brandName ? {
      '@type': 'Brand',
      name: product.manufacturer?.name || product.brandName,
    } : {
      '@type': 'Brand',
      name: 'Halalzi',
    },
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url: `${siteBase}/products/${slug}`,
      priceCurrency: 'BDT',
      price: sellingPrice,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: stockQuantity > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Halalzi',
      },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://halalzi.com',
      },
      ...(leafCategoryName && leafCategorySlug ? [{
        '@type': 'ListItem',
        position: 2,
        name: customerFacingLeafLabel || leafCategoryName,
        item: `https://halalzi.com/category/${leafCategorySlug}`,
      }] : []),
      {
        '@type': 'ListItem',
        position: (leafCategoryName && leafCategorySlug) ? 3 : 2,
        name: product.name,
        item: `https://halalzi.com/products/${slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div className="bg-gray-50 py-8">
        {/* MedEasy-style layout: centered container matching home page */}
        <div className="w-full max-w-[1480px] mx-auto px-4">
          <Link
            href={product.category?.slug ? `/category/${product.category.slug}` : '/products'}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {customerFacingLeafLabel ? `${customerFacingLeafLabel} — ফিরে যান` : 'পণ্যসমূহে ফিরে যান'}
          </Link>

          {/* lg:flex + items-start: two columns without stretching image column height to match long details */}
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            {/* Image container - max 600px width, 360px height like MedEasy (~573x343px) */}
            <div className="h-[360px] w-full max-w-[600px] shrink-0 mx-auto bg-white rounded-xl flex items-center justify-center overflow-hidden lg:mx-0">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  ছবি নেই
                </div>
              )}
            </div>

            {/* Details container - MedEasy style with white background card */}
            <div className="min-w-0 w-full flex-1 bg-white rounded-xl p-6 shadow-sm">
              {/* Product Name */}
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                  {product.name}
                  {showStrengthBesideTitle ? (
                    <span className="ml-2 text-lg font-normal text-gray-500">{strength}</span>
                  ) : null}
                  {volumeDisplay ? (
                    <span className="ml-2 inline-flex items-center align-middle rounded-full bg-teal-100 px-3 py-1 text-base font-semibold text-teal-800 lg:text-lg">
                      {volumeDisplay}
                    </span>
                  ) : null}
                </h1>
              </div>

              {/* Line 1 (grey): Parent Category/Department (for general products) OR Dosage Form (for medicines) */}
              {/* Only show if different from leaf category to avoid duplicates */}
              {showTopLine && (
                <div className="text-gray-600 mb-1">
                  {topLineText}
                </div>
              )}

              {/* Line 2 (green link): Generic Name (for medicines) OR Leaf Category (for general products) */}
              {genericName && (
                <div className="mb-4">
                  <span className="text-teal-600 font-medium hover:text-teal-700 cursor-pointer">
                    {genericName}
                  </span>
                </div>
              )}

              {/* Leaf category link for non-medicine products */}
              {!genericName && leafCategoryName && leafCategorySlug && (
                <div className="mb-4">
                  <Link
                    href={`/category/${leafCategorySlug}`}
                    className="text-teal-600 font-medium hover:text-teal-700"
                  >
                    {customerFacingLeafLabel}
                  </Link>
                </div>
              )}

              {/* Divider */}
              <hr className="my-4 border-gray-200" />

              {/* Manufacturer (MedEasy style: "Manufacturer: Square Pharmaceuticals PLC.") */}
              {manufacturerName && (
                <div className="mb-4">
                  <span className="text-gray-500 text-sm">প্রস্তুতকারক:</span>
                  {manufacturerSlug ? (
                    <Link
                      href={`/manufacturer/${manufacturerSlug}`}
                      className="ml-2 text-teal-600 font-medium hover:text-teal-700"
                    >
                      {manufacturerName}
                    </Link>
                  ) : (
                    <span className="ml-2 text-teal-600 font-medium">
                      {manufacturerName}
                    </span>
                  )}
                </div>
              )}

              <ProductDetailClient
                productId={product.id}
                shortShareUrl={shortShareUrl}
                name={product.name}
                sellingPrice={sellingPrice}
                mrp={mrp}
                stockQuantity={stockQuantity}
                imageUrl={displayImageUrl}
                category={product.category?.name ?? 'General'}
                unit={isMedicine && product.unit === 'pcs' ? 'strip' : product.unit}
                discountPercentage={discountPercentage}
                flashSalePrice={product.flashSalePrice}
                flashSaleStart={product.flashSaleStart}
                flashSaleEnd={product.flashSaleEnd}
                isFlashSale={product.isFlashSale}
                campaignPrice={product.campaignPrice}
                campaignStart={product.campaignStart}
                campaignEnd={product.campaignEnd}
                slug={slug}
                variants={variants}
                unitPrice={product.medicine?.unitPrice ? Number(product.medicine.unitPrice) : null}
                stripPrice={product.medicine?.stripPrice ? Number(product.medicine.stripPrice) : null}
                tabletsPerStrip={product.medicine?.tabletsPerStrip || null}
              />

              {product.description && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-gray-900">বিবরণ</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    বিষয়বস্তু বাংলায় দেখাতে অ্যাডমিনে বিবরণ বাংলায় সংরক্ষণ করুন।
                  </p>
                  <p className="mt-4 text-gray-600 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              <ProductIngredientsSection ingredientsRaw={product.ingredients} />

              <ProductKeyFeaturesGrid keyFeaturesRaw={product.keyFeatures} />

              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900">বিস্তারিত স্পেসিফিকেশন</h2>
                <ProductSpecsTable
                  category={customerFacingLeafLabel ?? 'শ্রেণীবিহীন'}
                  brand={product.brandName}
                  volumeSize={volumeDisplay}
                  productTypeLabel={productTypeLabelBn(product.type)}
                  manufacturer={
                    manufacturerName ? (
                      manufacturerSlug ? (
                        <Link
                          href={`/manufacturer/${manufacturerSlug}`}
                          className="font-medium text-teal-600 hover:text-teal-700"
                        >
                          {manufacturerName}
                        </Link>
                      ) : (
                        <span className="font-medium">{manufacturerName}</span>
                      )
                    ) : (
                      '—'
                    )
                  }
                  stockLabel={stockQuantity > 0 ? 'স্টকে আছে' : 'স্টক নেই'}
                  stockClassName={stockQuantity > 0 ? 'font-medium text-green-600' : 'font-medium text-red-600'}
                />
              </div>

              {product.specSummary && (
                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-5">
                  <h3 className="font-semibold text-gray-900">অতিরিক্ত তথ্য</h3>
                  <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">{product.specSummary}</p>
                </div>
              )}
            </div>
          </div>

          {/* Generic Alternatives + Similar — streamed so first paint is not blocked by extra DB work */}
          {genericName && (
            <Suspense fallback={<div className="mt-10 h-24 animate-pulse rounded-lg bg-gray-100" aria-hidden />}>
              <GenericAlternatives genericName={genericName} currentProductId={product.id} />
            </Suspense>
          )}

          <Suspense fallback={<div className="mt-10 h-40 animate-pulse rounded-lg bg-gray-100" aria-hidden />}>
            <SimilarProductsSection
              productId={product.id}
              categoryId={product.category?.id ?? null}
              brandName={product.brandName}
            />
          </Suspense>

          {/* Reviews Section */}
          <section className="mt-10 bg-white rounded-xl p-6 shadow-sm">
            <ProductReviews productId={product.id} />
          </section>
        </div>
      </div>
    </>
  )
}
