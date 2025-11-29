'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Zap } from 'lucide-react'
import { AddToCartButton } from '@/components/AddToCartButton'

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
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

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


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
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
        <div className="container mx-auto px-4">
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
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <Zap className="h-8 w-8 animate-pulse" />
              <h1 className="text-4xl font-bold md:text-5xl">Flash Sale</h1>
              <Zap className="h-8 w-8 animate-pulse" />
            </div>
            <p className="mb-6 text-lg text-teal-100 md:text-xl">
              Grab amazing deals on medicines and healthcare products!
            </p>

            {/* Countdown Timer */}
            {timeLeft && (
              <div className="mx-auto max-w-md">
                <div className="mb-2 flex items-center justify-center gap-2 text-sm text-teal-100">
                  <Clock className="h-4 w-4" />
                  <span>Sale ends in:</span>
                </div>
                <div className="flex justify-center gap-4">
                  <div className="rounded-lg bg-white/20 px-4 py-3 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</div>
                    <div className="text-xs text-teal-100">Hours</div>
                  </div>
                  <div className="rounded-lg bg-white/20 px-4 py-3 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</div>
                    <div className="text-xs text-teal-100">Minutes</div>
                  </div>
                  <div className="rounded-lg bg-white/20 px-4 py-3 backdrop-blur-sm">
                    <div className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</div>
                    <div className="text-xs text-teal-100">Seconds</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Top Deals ({data.count} {data.count === 1 ? 'Product' : 'Products'})
          </h2>
          <p className="text-gray-600">Sorted by highest discount</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.products.map((product) => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-lg bg-white shadow-md transition-shadow hover:shadow-xl"
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
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  {/* Discount Badge */}
                  <div className="absolute right-2 top-2 rounded-full bg-red-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
                    {product.discountPercentage}% OFF
                  </div>
                </div>
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-gray-900 hover:text-teal-600">
                    {product.name}
                  </h3>
                </Link>
                <p className="mb-3 text-xs text-gray-500">{product.category.name}</p>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-teal-600">
                      ৳{product.flashSalePrice?.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      ৳{product.sellingPrice.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-green-600">
                    Save ৳{(product.sellingPrice - (product.flashSalePrice || 0)).toFixed(2)}
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
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
