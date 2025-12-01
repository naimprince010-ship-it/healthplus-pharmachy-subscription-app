import { notFound } from 'next/navigation'
import { ProductDetailClient } from '@/components/ProductDetailClient'
import { ProductCard } from '@/components/ProductCard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import { getEffectivePrices } from '@/lib/pricing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Type for similar product with pre-computed prices
interface SimilarProduct {
  id: string
  type: 'MEDICINE' | 'GENERAL'
  name: string
  slug: string
  brandName: string | null
  description: string | null
  sellingPrice: number
  mrp: number | null
  stockQuantity: number
  imageUrl: string | null
  discountPercentage: number | null
  flashSalePrice: number | null
  flashSaleStart: string | null
  flashSaleEnd: string | null
  isFlashSale: boolean | null
  category: {
    id: string
    name: string
    slug: string
  }
  effectivePrice: number
  effectiveMrp: number
  effectiveDiscountPercent: number
  isFlashSaleActive: boolean
  cartInfo: { kind: 'product'; productId: string }
}

// Helper function to fetch similar products from the same category
async function getSimilarProducts(
  prisma: any,
  productId: string,
  categoryId: string | null,
  brandName: string | null
): Promise<SimilarProduct[]> {
  if (!categoryId) return []

  try {
    // Fetch products from the same category, excluding the current product
    const rawProducts = await prisma.product.findMany({
      where: {
        id: { not: productId },
        categoryId: categoryId,
        isActive: true,
      },
      select: {
        id: true,
        type: true,
        name: true,
        slug: true,
        brandName: true,
        description: true,
        sellingPrice: true,
        mrp: true,
        stockQuantity: true,
        imageUrl: true,
        discountPercentage: true,
        flashSalePrice: true,
        flashSaleStart: true,
        flashSaleEnd: true,
        isFlashSale: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      take: 10,
      orderBy: {
        sellingPrice: 'asc',
      },
    })

    // Pre-compute effective prices for each product to avoid hydration mismatch
    // Use defensive mapping to skip any products with missing/invalid data
    const mapped = rawProducts.map((p: any) => {
      try {
        // Skip products with missing required fields
        if (!p || !p.id || !p.slug || !p.name) {
          console.error('similarProducts: missing required fields for product', p?.id)
          return null
        }
        
        // Skip products with missing category (required for ProductCard)
        if (!p.category || !p.category.id || !p.category.name || !p.category.slug) {
          console.error('similarProducts: missing category for product', p.id)
          return null
        }

        // Ensure sellingPrice is valid
        const sellingPrice = Number(p.sellingPrice)
        if (isNaN(sellingPrice) || sellingPrice <= 0) {
          console.error('similarProducts: invalid sellingPrice for product', p.id)
          return null
        }

        const prices = getEffectivePrices({
          sellingPrice: sellingPrice,
          mrp: p.mrp != null ? Number(p.mrp) : null,
          discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
          flashSalePrice: p.flashSalePrice != null ? Number(p.flashSalePrice) : null,
          flashSaleStart: p.flashSaleStart,
          flashSaleEnd: p.flashSaleEnd,
          isFlashSale: p.isFlashSale,
        })

        return {
          id: p.id,
          type: p.type || 'GENERAL',
          name: p.name,
          slug: p.slug,
          brandName: p.brandName ?? null,
          description: p.description ?? null,
          sellingPrice: sellingPrice,
          mrp: p.mrp != null ? Number(p.mrp) : null,
          stockQuantity: Number(p.stockQuantity ?? 0),
          imageUrl: p.imageUrl ?? null,
          discountPercentage: p.discountPercentage != null ? Number(p.discountPercentage) : null,
          flashSalePrice: p.flashSalePrice != null ? Number(p.flashSalePrice) : null,
          flashSaleStart: p.flashSaleStart ? new Date(p.flashSaleStart).toISOString() : null,
          flashSaleEnd: p.flashSaleEnd ? new Date(p.flashSaleEnd).toISOString() : null,
          isFlashSale: p.isFlashSale ?? false,
          category: p.category,
          effectivePrice: prices.price,
          effectiveMrp: prices.mrp,
          effectiveDiscountPercent: prices.discountPercent,
          isFlashSaleActive: prices.isFlashSale,
          cartInfo: { kind: 'product' as const, productId: p.id },
        } as SimilarProduct
      } catch (err) {
        console.error('similarProducts: failed to map product', p?.id, err)
        return null
      }
    })

    // Filter out any null values from failed mappings
    return mapped.filter((p: SimilarProduct | null): p is SimilarProduct => p !== null)
  } catch (error) {
    console.error('Error fetching similar products:', error)
    return []
  }
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const { prisma } = await import('@/lib/prisma')
    
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        name: true,
      },
    })

    if (!product) {
      return {}
    }

    return {
      title: product.name,
      alternates: {
        canonical: `/products/${slug}`,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {}
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const { prisma } = await import('@/lib/prisma')

    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        sellingPrice: true,
        mrp: true,
        stockQuantity: true,
        brandName: true,
        description: true,
        keyFeatures: true,
        specSummary: true,
        sizeLabel: true,
        unit: true,
        type: true,
        isActive: true,
        discountPercentage: true,
        flashSalePrice: true,
        flashSaleStart: true,
        flashSaleEnd: true,
        isFlashSale: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parentCategory: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        manufacturer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        medicine: {
          select: {
            discountPercentage: true,
            genericName: true,
            dosageForm: true,
            strength: true,
            manufacturer: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            variantName: true,
            unitLabel: true,
            sizeLabel: true,
            mrp: true,
            sellingPrice: true,
            discountPercentage: true,
            stockQuantity: true,
            isDefault: true,
          },
        },
      },
    })

  if (!product || !product.isActive) {
    notFound()
  }

  // Fetch similar products from the same category with extra safety wrapper
  let similarProducts: SimilarProduct[] = []
  try {
    similarProducts = await getSimilarProducts(
      prisma,
      product.id,
      product.category?.id ?? null,
      product.brandName
    )
  } catch (e) {
    console.error('Error in getSimilarProducts for product', product.id, e)
    similarProducts = []
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
  
  // Top line text: dosage form (for medicines) OR parent department (for general products with hierarchy)
  const topLineText = isMedicine ? dosageForm : parentCategoryName
  
  // Normalize for comparison to avoid duplicates from whitespace/casing differences
  const normalizedTop = topLineText?.trim().toLowerCase() || ''
  const normalizedLeaf = leafCategoryName?.trim().toLowerCase() || ''
  const showTopLine = !!topLineText && normalizedTop !== normalizedLeaf

  return (
    <div className="bg-gray-50 py-8">
      {/* MedEasy-style layout: centered container matching home page */}
      <div className="w-full max-w-[1480px] mx-auto px-4">
        <Link
          href={product.category?.slug ? `/category/${product.category.slug}` : '/products'}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {product.category?.name ? `Back to ${product.category.name}` : 'Back to Products'}
        </Link>

        {/* MedEasy grid: 1.8fr image column + 1.4fr info column with gap-8 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1.4fr)] gap-6 lg:gap-8 items-start">
          {/* Image container - max 600px width, 360px height like MedEasy (~573x343px) */}
          <div className="w-full max-w-[600px] h-[360px] mx-auto lg:mx-0 bg-white rounded-xl flex items-center justify-center overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
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
                  {leafCategoryName}
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
              name={product.name}
              sellingPrice={sellingPrice}
              mrp={mrp}
              stockQuantity={stockQuantity}
              imageUrl={product.imageUrl}
              category={product.category?.name ?? 'General'}
              unit={product.unit}
              discountPercentage={discountPercentage}
              flashSalePrice={product.flashSalePrice}
              flashSaleStart={product.flashSaleStart}
              flashSaleEnd={product.flashSaleEnd}
              isFlashSale={product.isFlashSale}
              slug={slug}
              variants={variants}
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
                  <dd className="font-medium text-gray-900">{product.category?.name ?? 'Uncategorized'}</dd>
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

        {/* Similar Products Section */}
        {similarProducts && similarProducts.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              সমজাতীয় প্রোডাক্ট
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} product={item} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
