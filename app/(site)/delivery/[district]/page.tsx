import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { MapPin, Truck, ShieldCheck, Clock } from 'lucide-react'
import { MAIN_CONTAINER } from '@/lib/layout'
import { serializeJsonLd } from '@/lib/serialize-json-ld'
import { districts, getDistrictBySlug } from '@/lib/districts'

export const revalidate = 86400 // Revalidate once a day

interface DistrictPageProps {
  params: Promise<{
    district: string
  }>
}

export async function generateStaticParams() {
  return districts.map((district) => ({
    district: district.slug,
  }))
}

export async function generateMetadata({ params }: DistrictPageProps): Promise<Metadata> {
  const { district: slug } = await params
  const district = getDistrictBySlug(slug)

  if (!district) {
    return {}
  }

  const title = `Top E-commerce & Online Shopping in ${district.name} | Halalzi`
  const description = `Looking for the best online shopping experience in ${district.name}? Halalzi offers fast home delivery for authentic medicines, cosmetics, groceries, and baby care products in ${district.name}, Bangladesh.`

  return {
    title,
    description,
    keywords: `online shopping ${district.name}, ecommerce ${district.name}, medicine delivery ${district.name}, cosmetics shop ${district.name}, online pharmacy ${district.name}, grocery delivery ${district.name}`,
    alternates: {
      canonical: `/delivery/${district.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://halalzi.com/delivery/${district.slug}`,
    },
  }
}

export default async function DistrictDeliveryPage({ params }: DistrictPageProps) {
  const { district: slug } = await params
  const district = getDistrictBySlug(slug)

  if (!district) {
    notFound()
  }

  // Generate structured data for local business/service area
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Halalzi Home Delivery in ${district.name}`,
    provider: {
      '@type': 'Organization',
      name: 'Halalzi',
      url: 'https://halalzi.com',
    },
    areaServed: {
      '@type': 'City',
      name: district.name,
      addressCountry: 'BD'
    },
    description: `Fast and reliable home delivery of medicines, cosmetics, and groceries in ${district.name}.`
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="bg-gray-50">
        {/* Hero Section */}
        <div className="bg-teal-700 py-16 px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <MapPin className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
              Fast Delivery in {district.name}
            </h1>
            <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto">
              Your trusted online shopping destination in {district.name}. Get authentic medicines, premium cosmetics, and daily groceries delivered right to your doorstep.
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link
                href="/products"
                className="bg-white text-teal-700 hover:bg-gray-50 font-semibold py-3 px-8 rounded-lg shadow-sm transition-colors"
              >
                Start Shopping
              </Link>
              <Link
                href="/medicines"
                className="bg-teal-600 text-white hover:bg-teal-500 border border-teal-500 font-semibold py-3 px-8 rounded-lg shadow-sm transition-colors"
              >
                Order Medicines
              </Link>
            </div>
          </div>
        </div>

        <div className={MAIN_CONTAINER}>
          <div className="py-12">
            {/* Features Section */}
            <div className="grid gap-8 md:grid-cols-3 mb-16">
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="mx-auto bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Truck className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Home Delivery</h3>
                <p className="text-gray-600">
                  Reliable shipping across all areas in {district.name}. We ensure your products reach you safely.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="mx-auto bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">100% Authentic</h3>
                <p className="text-gray-600">
                  Every product we deliver to {district.name} is genuine and sourced directly from verified manufacturers.
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                <div className="mx-auto bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Service</h3>
                <p className="text-gray-600">
                  Quick processing and dispatch. Need essential medicines in {district.name}? Count on us.
                </p>
              </div>
            </div>

            {/* Popular Categories in this District */}
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Popular Categories in {district.name}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/medicines" className="group relative rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-teal-500 transition-colors p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600">Pharmacy & Medicines</h3>
                  <p className="text-sm text-gray-500 mt-2">Prescription & OTC items</p>
                </Link>
                <Link href="/category/cosmetics" className="group relative rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-teal-500 transition-colors p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600">Premium Cosmetics</h3>
                  <p className="text-sm text-gray-500 mt-2">Skincare & beauty</p>
                </Link>
                <Link href="/category/baby-care" className="group relative rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-teal-500 transition-colors p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600">Baby Care</h3>
                  <p className="text-sm text-gray-500 mt-2">Diapers & baby food</p>
                </Link>
                <Link href="/category/grocery" className="group relative rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-teal-500 transition-colors p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600">Daily Groceries</h3>
                  <p className="text-sm text-gray-500 mt-2">Essentials for your home</p>
                </Link>
              </div>
            </div>

            {/* SEO Text Section */}
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Why Choose Halalzi for Online Shopping in {district.name}?
              </h2>
              <div className="prose prose-teal max-w-none text-gray-600">
                <p>
                  As one of Bangladesh's leading e-commerce platforms, Halalzi is dedicated to providing the residents of {district.name} with a seamless online shopping experience. Whether you need urgent medicines, everyday groceries, or premium cosmetic brands, our comprehensive catalog has everything you need.
                </p>
                <p className="mt-4">
                  We understand the importance of quality and authenticity. That's why every product dispatched to our customers in {district.name} undergoes strict quality checks. Enjoy the convenience of ordering from home and let our dedicated delivery network handle the rest.
                </p>
              </div>
              <div className="mt-6 text-center">
                <Link href="/delivery" className="text-teal-600 hover:text-teal-800 font-medium hover:underline">
                  View all delivery locations across Bangladesh
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
