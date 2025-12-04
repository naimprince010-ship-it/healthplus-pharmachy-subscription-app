'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShoppingBag, Package, CreditCard, Heart, Camera, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    medicine?: { name: string } | null
    product?: { name: string } | null
  }>
}

interface Subscription {
  id: string
  plan: {
    name: string
    price: number
  }
  nextDeliveryDate: string
  isActive: boolean
}

interface Membership {
  id: string
  plan: {
    name: string
    discountPercent: number
  }
  endDate: string
  isActive: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  sellingPrice: number
  mrp: number | null
  discountPercentage: number | null
}

interface DashboardSettings {
  pageTitleBn: string
  welcomeTextBn: string
  showTotalOrdersCard: boolean
  showSubscriptionsCard: boolean
  showMembershipCard: boolean
  showWishlistCard: boolean
  showCrossSellSections: boolean
  totalOrdersLabelBn: string
  subscriptionsLabelBn: string
  membershipLabelBn: string
  wishlistLabelBn: string
  membershipUpsellTitleBn: string
  membershipUpsellButtonBn: string
  membershipActiveTitleBn: string
  recentOrdersTitleBn: string
  viewAllBn: string
  subscriptionsTitleBn: string
  curatedForYouTitleBn: string
  trendingNowTitleBn: string
  noOrdersTextBn: string
  startShoppingBn: string
  noSubscriptionsTextBn: string
  browsePlansBn: string
  curatedProductsCount: number
  trendingProductsCount: number
}

const DEFAULT_SETTINGS: DashboardSettings = {
  pageTitleBn: 'আমার ড্যাশবোর্ড',
  welcomeTextBn: 'স্বাগতম,',
  showTotalOrdersCard: true,
  showSubscriptionsCard: true,
  showMembershipCard: true,
  showWishlistCard: true,
  showCrossSellSections: true,
  totalOrdersLabelBn: 'মোট অর্ডার',
  subscriptionsLabelBn: 'সক্রিয় সাবস্ক্রিপশন',
  membershipLabelBn: 'মেম্বারশিপ স্ট্যাটাস',
  wishlistLabelBn: 'উইশলিস্ট',
  membershipUpsellTitleBn: 'আপনি এখনই ৳300 সেভ করার সুযোগ মিস করছেন!',
  membershipUpsellButtonBn: '৭ দিনের ফ্রি ট্রায়াল নিন',
  membershipActiveTitleBn: 'আপনার প্ল্যানে {remaining} টি ফ্রি ডেলিভারি বাকি আছে',
  recentOrdersTitleBn: 'সাম্প্রতিক অর্ডার',
  viewAllBn: 'সব দেখুন',
  subscriptionsTitleBn: 'সক্রিয় সাবস্ক্রিপশন',
  curatedForYouTitleBn: 'আপনার জন্য বাছাই করা',
  trendingNowTitleBn: 'এখন ট্রেন্ডিং',
  noOrdersTextBn: 'এখনো কোনো অর্ডার নেই',
  startShoppingBn: 'শপিং শুরু করুন →',
  noSubscriptionsTextBn: 'কোনো সক্রিয় সাবস্ক্রিপশন নেই',
  browsePlansBn: 'প্ল্যান দেখুন →',
  curatedProductsCount: 10,
  trendingProductsCount: 10,
}

export default function DashboardPageClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addItem } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [membership, setMembership] = useState<Membership | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([])
  const [curatedProducts, setCuratedProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch critical dashboard data first (orders, subscriptions, membership, wishlist, settings)
  // Products are fetched separately to not block the main dashboard loading
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      // Fetch critical data first - this determines when the dashboard shows
      Promise.all([
        fetch('/api/orders?limit=5').then((res) => res.json()),
        fetch('/api/subscriptions').then((res) => res.json()),
        fetch('/api/membership').then((res) => res.json()).catch(() => ({ membership: null })),
        fetch('/api/wishlist').then((res) => res.json()).catch(() => ({ items: [] })),
        fetch('/api/dashboard/settings').then((res) => res.json()).catch(() => ({ settings: DEFAULT_SETTINGS })),
      ])
        .then(([ordersData, subscriptionsData, membershipData, wishlistData, settingsData]) => {
          if (ordersData.orders) setOrders(ordersData.orders)
          if (subscriptionsData.subscriptions) setSubscriptions(subscriptionsData.subscriptions)
          if (membershipData.membership) setMembership(membershipData.membership)
          if (wishlistData.items) setWishlistCount(wishlistData.items.length)
          if (settingsData.settings) setSettings({ ...DEFAULT_SETTINGS, ...settingsData.settings })
        })
        .catch((err) => console.error('Failed to fetch dashboard data:', err))
        .finally(() => setIsLoading(false))
    }
  }, [status, router])

  // Fetch cross-sell products separately (non-blocking)
  useEffect(() => {
    if (status === 'authenticated' && !isLoading) {
      fetch('/api/products?limit=10&sort=popular')
        .then((res) => res.json())
        .then((productsData) => {
          if (productsData.products) {
            setTrendingProducts(productsData.products.slice(0, 10))
            setCuratedProducts(productsData.products.slice(0, 10))
          }
        })
        .catch((err) => console.error('Failed to fetch products:', err))
    }
  }, [status, isLoading])

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.sellingPrice,
      mrp: product.mrp || product.sellingPrice,
      type: 'PRODUCT',
      image: product.imageUrl || undefined,
      slug: product.slug || undefined,
    })
  }

  const getStatusBadgeClass = (orderStatus: string) => {
    switch (orderStatus) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-600'
      case 'CANCELLED':
        return 'bg-red-100 text-red-600'
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-600'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-yellow-100 text-yellow-600'
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA]">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-8 2xl:px-12 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 h-32" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const activeSubscriptions = subscriptions.filter((s) => s.isActive)

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-8 2xl:px-12 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900">
                {settings.pageTitleBn}
              </h1>
              <p className="text-gray-500 mt-1">
                {settings.welcomeTextBn} {session.user?.name}
              </p>
            </div>
          </div>

          {/* Stats Cards Grid - 4 columns on lg, 5 on 2xl */}
          <div className="grid grid-cols-4 2xl:grid-cols-5 gap-8 xl:gap-10 2xl:gap-12 mb-8">
            {settings.showTotalOrdersCard && (
              <Link href="/orders" className="bg-white rounded-xl shadow-sm p-6 xl:p-8 2xl:p-10 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <ShoppingBag className="h-10 w-10 xl:h-12 xl:w-12 text-[#0A9F6E]" />
                  </div>
                  <div>
                    <p className="text-3xl xl:text-4xl font-semibold text-gray-900">{orders.length}</p>
                    <p className="text-sm xl:text-base text-gray-500">{settings.totalOrdersLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}

            {settings.showSubscriptionsCard && (
              <Link href="/subscriptions" className="bg-white rounded-xl shadow-sm p-6 xl:p-8 2xl:p-10 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Package className="h-10 w-10 xl:h-12 xl:w-12 text-[#0A9F6E]" />
                  </div>
                  <div>
                    <p className="text-3xl xl:text-4xl font-semibold text-gray-900">{activeSubscriptions.length}</p>
                    <p className="text-sm xl:text-base text-gray-500">{settings.subscriptionsLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}

            {settings.showMembershipCard && (
              <Link href="/membership" className="bg-white rounded-xl shadow-sm p-6 xl:p-8 2xl:p-10 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <CreditCard className="h-10 w-10 xl:h-12 xl:w-12 text-[#0A9F6E]" />
                  </div>
                  <div>
                    <p className="text-xl xl:text-2xl font-semibold text-gray-900">
                      {membership ? membership.plan.name : 'None'}
                    </p>
                    <p className="text-sm xl:text-base text-gray-500">{settings.membershipLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}

            {settings.showWishlistCard && (
              <Link href="/dashboard/wishlist" className="bg-white rounded-xl shadow-sm p-6 xl:p-8 2xl:p-10 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Heart className="h-10 w-10 xl:h-12 xl:w-12 text-red-500" />
                  </div>
                  <div>
                    <p className="text-3xl xl:text-4xl font-semibold text-gray-900">{wishlistCount}</p>
                    <p className="text-sm xl:text-base text-gray-500">{settings.wishlistLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Membership Upsell Card */}
          {settings.showMembershipCard && !membership && (
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0A9F6E] to-[#12CBA0] p-6 xl:p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl xl:text-2xl font-bold">{settings.membershipUpsellTitleBn}</h3>
                  <p className="mt-2 text-white/80">Get exclusive discounts and free deliveries</p>
                </div>
                <Link
                  href="/memberships"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A9F6E] hover:bg-gray-100 transition-colors"
                >
                  {settings.membershipUpsellButtonBn}
                </Link>
              </div>
            </div>
          )}

          {/* Active Membership Card */}
          {settings.showMembershipCard && membership && (
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0A9F6E] to-[#12CBA0] p-6 xl:p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl xl:text-2xl font-bold">{membership.plan.name}</h3>
                  <p className="mt-2 text-white/80">
                    {membership.plan.discountPercent}% discount on all orders
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/80">Valid until</p>
                  <p className="text-lg font-semibold">{new Date(membership.endDate).toLocaleDateString('bn-BD')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl xl:text-2xl font-bold text-gray-900">{settings.recentOrdersTitleBn}</h2>
              <Link href="/orders" className="text-sm font-semibold text-[#0A9F6E] hover:text-[#088a5b]">
                {settings.viewAllBn}
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              {orders.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">{settings.noOrdersTextBn}</p>
                  <Link href="/products" className="mt-2 inline-block text-sm font-semibold text-[#0A9F6E]">
                    {settings.startShoppingBn}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                          <ShoppingBag className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.items.length} items • ৳{order.total}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Subscriptions Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl xl:text-2xl font-bold text-gray-900">{settings.subscriptionsTitleBn}</h2>
              <Link href="/subscriptions" className="text-sm font-semibold text-[#0A9F6E] hover:text-[#088a5b]">
                {settings.viewAllBn}
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-sm">
              {activeSubscriptions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">{settings.noSubscriptionsTextBn}</p>
                  <Link href="/subscriptions" className="mt-2 inline-block text-sm font-semibold text-[#0A9F6E]">
                    {settings.browsePlansBn}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeSubscriptions.slice(0, 5).map((subscription) => (
                    <div key={subscription.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-gray-900">{subscription.plan.name}</p>
                        <p className="text-sm text-gray-500">
                          Next delivery: {new Date(subscription.nextDeliveryDate).toLocaleDateString('bn-BD')}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">৳{subscription.plan.price}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cross-Selling Sections */}
          {settings.showCrossSellSections && (
            <>
              {/* Curated For You */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl xl:text-2xl font-bold text-gray-900">{settings.curatedForYouTitleBn}</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {curatedProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[200px] bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative aspect-square mb-3 rounded-lg bg-gray-100 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                          )}
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{product.discountPercentage}%
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#0A9F6E]">৳{product.sellingPrice}</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full bg-[#0A9F6E] px-3 py-1 text-xs font-medium text-white hover:bg-[#088a5b] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Now */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl xl:text-2xl font-bold text-gray-900">{settings.trendingNowTitleBn}</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {trendingProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[200px] bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative aspect-square mb-3 rounded-lg bg-gray-100 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                          )}
                          {product.discountPercentage && product.discountPercentage > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{product.discountPercentage}%
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#0A9F6E]">৳{product.sellingPrice}</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full bg-[#0A9F6E] px-3 py-1 text-xs font-medium text-white hover:bg-[#088a5b] transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="block lg:hidden">
        <div className="px-4 py-6 pb-32">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">{settings.pageTitleBn}</h1>
            <p className="text-sm text-gray-500">{settings.welcomeTextBn} {session.user?.name}</p>
          </div>

          {/* Stats Cards - Stacked */}
          <div className="space-y-4 mb-6">
            {settings.showTotalOrdersCard && (
              <Link href="/orders" className="block bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <ShoppingBag className="h-10 w-10 text-[#0A9F6E]" />
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                    <p className="text-sm text-gray-500">{settings.totalOrdersLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}

            {settings.showSubscriptionsCard && (
              <Link href="/subscriptions" className="block bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <Package className="h-10 w-10 text-[#0A9F6E]" />
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{activeSubscriptions.length}</p>
                    <p className="text-sm text-gray-500">{settings.subscriptionsLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}

            {settings.showMembershipCard && (
              <Link href="/membership" className="block bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <CreditCard className="h-10 w-10 text-[#0A9F6E]" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {membership ? membership.plan.name : 'No Membership'}
                    </p>
                    <p className="text-sm text-gray-500">{settings.membershipLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}

            {settings.showWishlistCard && (
              <Link href="/dashboard/wishlist" className="block bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-4">
                  <Heart className="h-10 w-10 text-red-500" />
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">{wishlistCount}</p>
                    <p className="text-sm text-gray-500">{settings.wishlistLabelBn}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Membership Upsell Card - Mobile */}
          {settings.showMembershipCard && !membership && (
            <div className="mb-6 rounded-xl bg-gradient-to-r from-[#0A9F6E] to-[#12CBA0] p-4 text-white">
              <h3 className="text-lg font-bold">{settings.membershipUpsellTitleBn}</h3>
              <Link
                href="/memberships"
                className="mt-3 block w-full rounded-full bg-white py-3 text-center text-sm font-semibold text-[#0A9F6E]"
              >
                {settings.membershipUpsellButtonBn}
              </Link>
            </div>
          )}

          {/* Recent Orders - Mobile */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{settings.recentOrdersTitleBn}</h2>
              <Link href="/orders" className="text-sm font-medium text-[#0A9F6E]">
                {settings.viewAllBn}
              </Link>
            </div>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white rounded-xl p-6 text-center shadow-sm">
                  <p className="text-gray-500">{settings.noOrdersTextBn}</p>
                  <Link href="/products" className="mt-2 inline-block text-sm font-semibold text-[#0A9F6E]">
                    {settings.startShoppingBn}
                  </Link>
                </div>
              ) : (
                orders.slice(0, 3).map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                        </p>
                        <p className="text-sm text-gray-500">{order.items.length} items • ৳{order.total}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Cross-Selling - Mobile */}
          {settings.showCrossSellSections && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{settings.curatedForYouTitleBn}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {curatedProducts.slice(0, 6).map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[140px] bg-white rounded-xl shadow-sm p-3">
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative aspect-square mb-2 rounded-lg bg-gray-100 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0A9F6E]">৳{product.sellingPrice}</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full bg-[#0A9F6E] px-2 py-1 text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{settings.trendingNowTitleBn}</h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {trendingProducts.slice(0, 6).map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-[140px] bg-white rounded-xl shadow-sm p-3">
                      <Link href={`/products/${product.slug}`}>
                        <div className="relative aspect-square mb-2 rounded-lg bg-gray-100 overflow-hidden">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <h3 className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
                      </Link>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#0A9F6E]">৳{product.sellingPrice}</p>
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full bg-[#0A9F6E] px-2 py-1 text-xs text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Floating Prescription Upload Button - Mobile Only */}
        <Link
          href="/prescriptions"
          className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0A9F6E] text-white shadow-xl hover:bg-[#088a5b] transition-colors"
        >
          <Camera className="h-6 w-6" />
        </Link>
      </div>
    </div>
  )
}
