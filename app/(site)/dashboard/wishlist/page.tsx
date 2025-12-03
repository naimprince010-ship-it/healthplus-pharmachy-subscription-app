'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart, buildUnitLabelBn } from '@/contexts/CartContext'
import { MAIN_CONTAINER } from '@/lib/layout'

export default function WishlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, isLoading, removeFromWishlist, refetch } = useWishlist()
  const { addItem } = useCart()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?redirect=/dashboard/wishlist')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      refetch()
    }
  }, [status, refetch])

    const handleAddToCart = (item: typeof items[0]) => {
      addItem({
        id: item.productId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.imageUrl || undefined,
        type: item.type === 'MEDICINE' ? 'MEDICINE' : 'PRODUCT',
        category: item.category.name,
        mrp: item.mrp || undefined,
        slug: item.slug,
        unitLabelBn: buildUnitLabelBn({}), // Default to piece for wishlist items
      })
    }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-8">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 bg-white px-4 py-3 shadow-sm lg:hidden">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">আমার পছন্দের তালিকা</h1>
      </div>

      <div className={`${MAIN_CONTAINER} py-6 lg:py-12`}>
        {/* Desktop Header */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">আমার পছন্দের তালিকা</h1>
            <p className="mt-1 text-gray-600">
              {items.length > 0 
                ? `${items.length}টি পণ্য আপনার পছন্দের তালিকায় আছে`
                : 'আপনার পছন্দের তালিকা খালি'}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-teal-600 hover:text-teal-700"
          >
            ← ড্যাশবোর্ডে ফিরুন
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <Heart className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">আপনার পছন্দের তালিকা খালি</h2>
            <p className="mt-2 text-gray-600">
              পণ্যের পাশে হার্ট আইকনে ক্লিক করে পছন্দের তালিকায় যোগ করুন
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700"
            >
              <ShoppingCart className="h-5 w-5" />
              শপিং শুরু করুন
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const hasDiscount = item.discountPercentage && item.discountPercentage > 0
              const discountedPrice = hasDiscount 
                ? item.price * (1 - (item.discountPercentage || 0) / 100)
                : item.price

              return (
                <div
                  key={item.id}
                  className="group relative flex flex-col rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute left-2 top-2 z-10 rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.discountPercentage}% ডিস্কাউন্ট
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute right-2 top-2 z-10 rounded-full bg-white p-1.5 shadow-sm transition-colors hover:bg-red-50"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>

                  {/* Product Image */}
                  <Link href={`/products/${item.slug}`} className="block">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="mt-3 flex flex-1 flex-col">
                    <Link href={`/products/${item.slug}`}>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-teal-600">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">{item.category.name}</p>

                    {/* Price */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        ৳{discountedPrice.toFixed(0)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">
                          ৳{item.price.toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    {item.stockQuantity <= 0 ? (
                      <p className="mt-2 text-sm font-medium text-red-500">স্টক নেই</p>
                    ) : item.stockQuantity < 10 ? (
                      <p className="mt-2 text-sm font-medium text-orange-500">
                        মাত্র {item.stockQuantity}টি বাকি
                      </p>
                    ) : null}

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={item.stockQuantity <= 0}
                      className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition-colors ${
                        item.stockQuantity <= 0
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'bg-teal-600 text-white hover:bg-teal-700'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      কার্টে যোগ করুন
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
