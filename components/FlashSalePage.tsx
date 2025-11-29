'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Zap } from 'lucide-react'
import { AddToCartButton } from '@/components/AddToCartButton'
import { MAIN_CONTAINER } from '@/lib/layout'

interface Product {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sellingPrice: number
  flashSalePrice: number | null
  flashSaleEnd: string
  discountPercentage: number
  stockQuantity: number
  category: {
    id: string
    name: string
    slug: string
  }
}

interface FlashSaleData {
  products: Product[]
  count: number
}

export default function FlashSalePage() {
  const [data, setData] = useState<FlashSaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // Set mounted to true after hydration to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchFlashSaleProducts()
  }, [])

  useEffect(() => {
    if (!data?.products.length) return

    const nearestEnd = data.products.reduce((nearest, product) => {
      const endTime = new Date(product.flashSaleEnd).getTime()
      return endTime < nearest ? endTime : nearest
    }, new Date(data.products[0].flashSaleEnd).getTime())

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = nearestEnd - now

      if (distance < 0) {
        setTimeLeft(null)
        clearInterval(timer)
        fetchFlashSaleProducts()
        return
      }

      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }, 1000)

    return () => clearInterval(timer)
  }, [data])

  const fetchFlashSaleProducts = async () => {
    try {
      const response = await fetch('/api/flash-sale')
      
      if (!response.ok) {
        console.error('API error:', response.status, response.statusText)
        setData({ products: [], count: 0 })
        return
      }
      
      const result = await response.json()
      
      if (result && Array.isArray(result.products)) {
        setData(result)
      } else {
        console.error('Invalid API response structure:', result)
        setData({ products: [], count: 0 })
      }
    } catch (error) {
      console.error('Error fetching flash sale products:', error)
      setData({ products: [], count: 0 })
    } finally {
      setLoading(false)
    }
  }


  // Show loading state for both SSR (not mounted) and client loading
  // This ensures server and client render identical HTML initially
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className={MAIN_CONTAINER}>
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading flash sale products...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.products.length) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className={MAIN_CONTAINER}>
          <div className="text-center">
            <Zap className="mx-auto h-16 w-16 text-gray-400" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">No Flash Sales Active</h2>
            <p className="mt-2 text-gray-600">Check back soon for amazing deals!</p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-teal-600 px-6 py-3 text-white hover:bg-teal-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Compact */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 py-4 text-white">
        <div className={MAIN_CONTAINER}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 animate-pulse" />
              <h1 className="text-xl font-bold sm:text-2xl">Flash Sale</h1>
              <Zap className="h-5 w-5 animate-pulse" />
            </div>

            {/* Countdown Timer - Inline */}
            {timeLeft && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-100" />
                <div className="flex gap-2">
                  <div className="rounded bg-white/20 px-2 py-1 text-center">
                    <span className="text-lg font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-xs text-teal-100">h</span>
                  </div>
                  <span className="text-lg font-bold">:</span>
                  <div className="rounded bg-white/20 px-2 py-1 text-center">
                    <span className="text-lg font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-xs text-teal-100">m</span>
                  </div>
                  <span className="text-lg font-bold">:</span>
                  <div className="rounded bg-white/20 px-2 py-1 text-center">
                    <span className="text-lg font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <span className="text-xs text-teal-100">s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid - Compact */}
      <div className={`${MAIN_CONTAINER} py-6`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Top Deals ({data.count} {data.count === 1 ? 'Product' : 'Products'})
            </h2>
            <p className="text-sm text-gray-600">Sorted by highest discount</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {data.products.map((product) => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Product Image */}
              <Link href={`/products/${product.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                  {/* Discount Badge */}
                  <div className="absolute right-1 top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow">
                    {product.discountPercentage}% OFF
                  </div>
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-2">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="mb-1 line-clamp-2 text-xs font-semibold text-gray-900 hover:text-teal-600">
                    {product.name}
                  </h3>
                </Link>
                <p className="mb-1 text-[10px] text-gray-500">{product.category.name}</p>

                {/* Pricing */}
                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-teal-600">
                      ৳{product.flashSalePrice?.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-gray-500 line-through">
                      ৳{product.sellingPrice.toFixed(0)}
                    </span>
                  </div>
                  <p className="text-[10px] text-green-600">
                    Save ৳{(product.sellingPrice - (product.flashSalePrice || 0)).toFixed(0)}
                  </p>
                </div>

                {/* Add to Cart Button */}
                <AddToCartButton
                  productId={product.id}
                  name={product.name}
                  price={product.flashSalePrice ?? product.sellingPrice}
                  mrp={product.sellingPrice}
                  image={product.imageUrl ?? undefined}
                  stockQuantity={product.stockQuantity}
                  category={product.category?.name ?? 'General'}
                  type="PRODUCT"
                  className="w-full text-xs py-1.5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
