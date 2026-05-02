import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AddToCartButton } from '@/components/AddToCartButton'
import { getEffectivePrices } from '@/lib/pricing'
import { getStorefrontImageUrl } from '@/lib/image-url'
import type { Metadata } from 'next'
import { GROCERY_CATEGORY_SLUG, isGroceryShopEnabled, isMedicineShopEnabled } from '@/lib/site-features'

export const revalidate = 60 // Revalidate page every 60 seconds (ISR)

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      imageUrl: true,
    },
  })

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  const title = `${category.name} এর দাম এবং অফার - অনলাইনে কিনুন সেরা দামে | Halalzi`
  const description = category.description || `অরিজিনাল ${category.name} পণ্য অনলাইনে কিনুন সেরা দামে। বিকাশ ডিসকাউন্ট অফার, ফ্রি ডেলিভারি প্রোডাক্ট এবং দ্রুততম ডেলিভারি। Halalzi - আপনার বিশ্বস্ত অনলাইন শপ।`
  const resolvedOgUrl = category.imageUrl ? getStorefrontImageUrl(category.imageUrl) : null
  const ogImage: string =
    resolvedOgUrl ?? 'https://halalzi.com/images/default-product.png'

  return {
    title,
    description,
    keywords: `${category.name}, অরিজিনাল ${category.name} এর দাম, ${category.name} এর অফার, সেরা ${category.name}, ${category.name} অনলাইন, ${category.name} কিনুন, ${category.name} দাম, বিকাশ ডিসকাউন্ট অফার, Halalzi`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://halalzi.com/category/${slug}`,
      images: [{ url: ogImage }],
      siteName: 'Halalzi',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: `https://halalzi.com/category/${slug}`,
    },
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params

  const category = await prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      isMedicineCategory: true,
      isActive: true,
    },
  })

  if (!category || !category.isActive) {
    notFound()
  }

  if (!isMedicineShopEnabled() && category.isMedicineCategory) {
    notFound()
  }
  if (!isGroceryShopEnabled() && slug === GROCERY_CATEGORY_SLUG) {
    notFound()
  }

  const categoryImageUrl = getStorefrontImageUrl(category.imageUrl)

  // Find ALL descendant categories recursively (not just direct children)
  // This allows parent categories (like "Women's Choice") to show products from all nested subcategories
  async function getAllDescendantCategoryIds(parentId: string): Promise<string[]> {
    const children = await prisma.category.findMany({
      where: { parentCategoryId: parentId },
      select: { id: true },
    })

    if (children.length === 0) {
      return []
    }

    const childIds = children.map(c => c.id)
    const grandchildIds = await Promise.all(
      childIds.map(id => getAllDescendantCategoryIds(id))
    )

    return [...childIds, ...grandchildIds.flat()]
  }

  const descendantIds = await getAllDescendantCategoryIds(category.id)

  // Build array of category IDs: parent + all descendants (children, grandchildren, etc.)
  const categoryIds = [category.id, ...descendantIds]

  let items: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    imageUrl: string | null
    imagePath?: string | null
    mrp: number | null
    sellingPrice: number
    stockQuantity: number
    isFeatured: boolean
    requiresPrescription?: boolean
    genericName?: string | null
    strength?: string | null
    discountPercentage?: number | null
    campaignPrice?: number | null
    campaignStart?: Date | null
    campaignEnd?: Date | null
  }> = []

  if (category.isMedicineCategory) {
    const medicines = await prisma.medicine.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        imagePath: true,
        mrp: true,
        sellingPrice: true,
        stockQuantity: true,
        isFeatured: true,
        requiresPrescription: true,
        genericName: true,
        strength: true,
        discountPercentage: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    items = medicines.map((m) => ({
      ...m,
      imageUrl: m.imageUrl || (m.imagePath
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/medicine-images/${m.imagePath}`
        : null),
    }))
  } else {
    const products = await prisma.product.findMany({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        mrp: true,
        sellingPrice: true,
        stockQuantity: true,
        isFeatured: true,
        discountPercentage: true,
        campaignPrice: true,
        campaignStart: true,
        campaignEnd: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    })

    items = products.map((p) => ({
      ...p,
      requiresPrescription: false,
    }))
  }

  // Find the lowest price and if there's any active offer
  const lowestPrice = items.length > 0
    ? Math.min(...items.map(i => i.sellingPrice))
    : 0
  const maxDiscount = items.length > 0
    ? Math.max(...items.map(i => i.discountPercentage || 0))
    : 0

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
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: `https://halalzi.com/category/${slug}`,
      },
    ],
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    description: category.description || `${category.name} পণ্য`,
    numberOfItems: items.length,
    itemListElement: items.slice(0, 10).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        url: `https://halalzi.com/${category.isMedicineCategory ? 'medicines' : 'products'}/${item.slug}`,
        image: item.imageUrl || 'https://halalzi.com/images/default-product.png',
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BDT',
          price: item.discountPercentage && item.discountPercentage > 0
            ? item.sellingPrice * (1 - item.discountPercentage / 100)
            : item.sellingPrice,
          availability: item.stockQuantity > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      },
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `${category.name} এর দাম কত?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: lowestPrice > 0 
            ? `আমাদের ওয়েবসাইটে অরিজিনাল ${category.name} এর দাম শুরু মাত্র ৳${lowestPrice.toFixed(2)} টাকা থেকে।` 
            : `আমাদের ওয়েবসাইটে অথেনটিক ${category.name} পণ্য অত্যন্ত সাশ্রয়ী মূল্যে পাওয়া যায়।`,
        },
      },
      {
        '@type': 'Question',
        name: `${category.name} এ কি কোনো ডিসকাউন্ট বা অফার আছে?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: maxDiscount > 0
            ? `হ্যাঁ! আমাদের এখানে ${category.name} পণ্যে সর্বোচ্চ ${maxDiscount}% পর্যন্ত ছাড়ের চমৎকার সব ডিসকাউন্ট অফার রয়েছে।`
            : `হ্যাঁ! আমাদের এখানে ক্যাশ অন ডেলিভারি এবং বিকাশ পেমেন্ট ডিসকাউন্ট অফার সহ বিভিন্ন সাশ্রয়ী দামে ${category.name} কেনা যায়।`,
        },
      },
      {
        '@type': 'Question',
        name: `${category.name} কীভাবে অর্ডার করব?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `আপনি সরাসরি Halalzi সাইট থেকে আপনার পছন্দের পণ্যটি কার্টে যোগ করে ক্যাশ অন ডেলিভারি বা অনলাইনে পেমেন্টের মাধ্যমে অর্ডার করতে পারেন।`,
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="bg-white py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Category Header */}
          <div className="mb-8">
            <nav className="mb-4 text-sm text-gray-500">
              <Link href="/" className="hover:text-teal-600">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{category.name}</span>
            </nav>

            <div className="flex items-center gap-4">
              {categoryImageUrl && (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <img
                    src={categoryImageUrl}
                    alt={category.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{category.name} এর দাম এবং অফার</h1>
                {category.description ? (
                  <p className="mt-1 text-gray-600">{category.description}</p>
                ) : (
                  <p className="mt-1 text-gray-600">অরিজিনাল {category.name} পণ্য অনলাইনে কিনুন সেরা দামে। বিকাশ ডিসকাউন্ট অফার, ফ্রি ডেলিভারি প্রোডাক্ট এবং দ্রুততম ডেলিভারি।</p>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              {items.length} {category.isMedicineCategory ? 'medicines' : 'products'} found
            </div>
          </div>

          {/* Products Grid */}
          {items.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500">No {category.isMedicineCategory ? 'medicines' : 'products'} found in this category</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((item) => {
                const detailPath = category.isMedicineCategory
                  ? `/medicines/${item.slug}`
                  : `/products/${item.slug}`

                const pricing = getEffectivePrices({
                  sellingPrice: item.sellingPrice,
                  mrp: item.mrp,
                  discountPercentage: item.discountPercentage,
                  campaignPrice: item.campaignPrice,
                  campaignStart: item.campaignStart,
                  campaignEnd: item.campaignEnd,
                })

                const hasDiscount = pricing.discountPercent > 0
                const discountedPrice = pricing.price
                const isCampaign = pricing.isCampaign

                const displayImageUrl = getStorefrontImageUrl(item.imageUrl)
                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <Link href={detailPath} className="flex-1">
                      <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-gray-100">
                        {displayImageUrl ? (
                          <img
                            src={displayImageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                        {hasDiscount && (
                          <span className={`absolute left-2 top-2 z-10 rounded px-2 py-1 text-xs font-semibold text-white ${isCampaign ? 'bg-orange-500' : 'bg-red-500'}`}>
                            {pricing.discountPercent}% {isCampaign ? 'OFF' : 'ডিস্কাউন্ট'}
                          </span>
                        )}
                        {item.isFeatured && !hasDiscount && (
                          <span className="absolute left-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-semibold text-gray-900">
                            Featured
                          </span>
                        )}
                        {item.requiresPrescription && (
                          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                            Rx
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">
                        {item.name}
                      </h3>
                      {item.genericName && (
                        <p className="mt-1 text-sm text-gray-600">
                          {item.genericName}
                        </p>
                      )}
                      {item.strength && (
                        <p className="mt-1 text-xs text-gray-500">{item.strength}</p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            ৳{discountedPrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-500 line-through">
                              ৳{pricing.mrp.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.stockQuantity === 0 && (
                        <p className="mt-2 text-xs text-red-600">Out of stock</p>
                      )}
                    </Link>
                    <div className="mt-4">
                      {category.isMedicineCategory ? (
                        <AddToCartButton
                          medicineId={item.id}
                          name={item.name}
                          price={discountedPrice}
                          image={displayImageUrl || undefined}
                          requiresPrescription={item.requiresPrescription}
                          stockQuantity={item.stockQuantity}
                          className="w-full"
                        />
                      ) : (
                        <AddToCartButton
                          productId={item.id}
                          name={item.name}
                          price={discountedPrice}
                          image={displayImageUrl || undefined}
                          stockQuantity={item.stockQuantity}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
