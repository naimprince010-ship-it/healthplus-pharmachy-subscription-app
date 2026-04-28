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
import { getCachedProductBySlug } from './get-product-by-slug'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'
import { SimilarProductsSection } from './SimilarProductsSection'

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
    const seoTitle = product.seoTitle || `${product.name}${categoryName ? ` - ${categoryName}` : ''} | Halalzi`
    const seoDescription = product.seoDescription || product.description || `Buy ${product.name} online at best price from Halalzi. Fast delivery across Bangladesh.`

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
        url: `https://halalzi.com/products/${slug}`,
        siteName: 'Halalzi',
        type: 'website',
        images: product.imageUrl ? [product.imageUrl] : [],
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} - Buy online at best price`,
    image: product.imageUrl || undefined,
    sku: product.id,
    brand: product.manufacturer?.name || product.brandName ? {
      '@type': 'Brand',
      name: product.manufacturer?.name || product.brandName,
    } : undefined,
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url: `https://halalzi.com/products/${slug}`,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-gray-50 py-8">
        {/* MedEasy-style layout: centered container matching home page */}
        <div className="w-full max-w-[1480px] mx-auto px-4">
          <Link
            href={product.category?.slug ? `/category/${product.category.slug}` : '/products'}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {customerFacingLeafLabel ? `Back to ${customerFacingLeafLabel}` : 'Back to Products'}
          </Link>

          {/* MedEasy grid: 1.8fr image column + 1.4fr info column with gap-8 */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)] gap-6 lg:gap-8 items-start">
            {/* Image container - max 600px width, 360px height like MedEasy (~573x343px) */}
            <div className="w-full max-w-[600px] h-[360px] mx-auto lg:mx-0 bg-white rounded-xl flex items-center justify-center overflow-hidden">
              {displayImageUrl ? (
                <img
                  src={displayImageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {/* Details container - MedEasy style with white background card */}
            <div className="w-full bg-white rounded-xl p-6 shadow-sm">
              {/* Product Name + Strength (MedEasy style: "Ace 500 mg") */}
              <div className="mb-2">
                <h1 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                  {product.name}
                  {strength && (
                    <span className="ml-2 text-lg font-normal text-gray-500">
                      {strength}
                    </span>
                  )}
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
                  <span className="text-gray-500 text-sm">Manufacturer:</span>
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
                  <h2 className="text-xl font-bold text-gray-900">Description</h2>
                  <p className="mt-4 text-gray-600 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {product.keyFeatures && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-gray-900">Key Features</h2>
                  <div className="mt-4 space-y-2">
                    {(product.keyFeatures?.split('\n') ?? []).filter(f => f.trim()).map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-teal-600" />
                        <span className="text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {product.specSummary && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
                  <p className="mt-4 text-gray-600 whitespace-pre-line">
                    {product.specSummary}
                  </p>
                </div>
              )}

              <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="font-semibold text-gray-900">Product Information</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Category</dt>
                    <dd className="font-medium text-gray-900">{customerFacingLeafLabel ?? 'Uncategorized'}</dd>
                  </div>
                  {product.brandName && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Brand</dt>
                      <dd className="font-medium text-gray-900">{product.brandName}</dd>
                    </div>
                  )}
                  {product.unit && (
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Unit</dt>
                      <dd className="font-medium text-gray-900">{product.unit}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Availability</dt>
                    <dd className={`font-medium ${stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                    </dd>
                  </div>
                </dl>
              </div>
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
