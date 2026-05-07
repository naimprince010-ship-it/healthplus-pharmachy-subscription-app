import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { MapPin, Truck, ShieldCheck, Clock, ChevronRight } from 'lucide-react'
import { MAIN_CONTAINER } from '@/lib/layout'
import { serializeJsonLd } from '@/lib/serialize-json-ld'
import { getAllThanasWithDistrictSlug, getUnionsByUpazilaSlug } from '@/lib/bd-locations'

export const revalidate = 86400 // Revalidate once a day

interface ThanaPageProps {
  params: Promise<{
    district: string
    thana: string
  }>
}

export async function generateStaticParams() {
  // Return empty array to use On-Demand ISR.
  // This prevents generating 5000+ thana pages during the Vercel build.
  // Pages will be generated and cached on the first user request.
  return []
}

export async function generateMetadata({ params }: ThanaPageProps): Promise<Metadata> {
  const { district: districtSlug, thana: thanaSlug } = await params
  
  const allThanas = getAllThanasWithDistrictSlug()
  const location = allThanas.find(
    (t) => t.slug === thanaSlug && t.districtSlug === districtSlug
  )

  if (!location) {
    return {}
  }

  const title = `Top E-commerce & Online Shopping in ${location.name}, ${location.districtName} | Halalzi`
  const description = `Looking for the best online shopping experience in ${location.name}? Halalzi offers fast home delivery for authentic medicines, cosmetics, groceries, and baby care products in ${location.name}, ${location.districtName}, Bangladesh.`

  return {
    title,
    description,
    keywords: `online shopping ${location.name}, ecommerce ${location.name}, medicine delivery ${location.name}, cosmetics shop ${location.name}, online pharmacy ${location.name}, grocery delivery ${location.name}, ${location.districtName}, অনলাইনে কেনাকাটা ${location.name}, ঔষধ ডেলিভারি ${location.name}, কসমেটিকস ${location.name}`,
    alternates: {
      canonical: `/delivery/${location.districtSlug}/${location.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://halalzi.com/delivery/${location.districtSlug}/${location.slug}`,
    },
  }
}

export default async function ThanaDeliveryPage({ params }: ThanaPageProps) {
  const { district: districtSlug, thana: thanaSlug } = await params
  
  const allThanas = getAllThanasWithDistrictSlug()
  const location = allThanas.find(
    (t) => t.slug === thanaSlug && t.districtSlug === districtSlug
  )

  if (!location) {
    notFound()
  }

  const unions = getUnionsByUpazilaSlug(districtSlug, thanaSlug) || []

  // Generate structured data for local business/service area
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `Halalzi Home Delivery in ${location.name}, ${location.districtName}`,
    provider: {
      '@type': 'Organization',
      name: 'Halalzi',
      url: 'https://halalzi.com',
    },
    areaServed: {
      '@type': 'City',
      name: location.name,
      containedInPlace: {
        '@type': 'City',
        name: location.districtName
      },
      addressCountry: 'BD'
    },
    description: `Fast and reliable home delivery of medicines, cosmetics, and groceries in ${location.name}, ${location.districtName}.`
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="bg-gray-50/50">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#042f2e] py-20 px-4 sm:px-6 lg:px-8 text-center text-white">
          {/* Animated Background Blob */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-light/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-10 -right-10 w-72 h-72 bg-cta/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          
          <div className="relative max-w-3xl mx-auto z-10">
            {/* Breadcrumb */}
            <div className="flex justify-center items-center gap-2 mb-6 text-sm font-medium text-primary-100 opacity-80">
              <Link href="/delivery" className="hover:text-white transition-colors">Delivery</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/delivery/${location.districtSlug}`} className="hover:text-white transition-colors">{location.districtName}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white">{location.name}</span>
            </div>

            <div className="flex justify-center mb-8 animate-fade-in-up">
              <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20">
                <MapPin className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 animate-fade-in-up animation-delay-200">
              Fast Delivery in <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-cta-light">{location.name}</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-50 max-w-2xl mx-auto mb-10 animate-fade-in-up animation-delay-400 font-medium leading-relaxed opacity-90">
              Your premium online shopping destination in {location.name}, {location.districtName}. Get authentic medicines, branded cosmetics, and daily essentials delivered right to your doorstep.
            </p>
            <div className="flex justify-center gap-4 flex-wrap animate-fade-in-up animation-delay-600">
              <Link
                href="/products"
                className="group relative bg-white text-primary-dark hover:bg-gray-50 font-bold py-3.5 px-8 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10">Start Shopping</span>
              </Link>
              <Link
                href="/medicines"
                className="group relative bg-gradient-to-r from-cta to-cta-dark text-white font-bold py-3.5 px-8 rounded-xl shadow-[0_8px_30px_rgb(249,115,22,0.3)] transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-cta-light/30"
              >
                <span className="relative z-10">Order Medicines</span>
              </Link>
            </div>
          </div>
        </div>

        <div className={MAIN_CONTAINER}>
          <div className="py-16">
            {/* Features Section */}
            <div className="grid gap-6 md:grid-cols-3 mb-20">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transition-transform hover:-translate-y-1 duration-300">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform -rotate-3">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">Home Delivery</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Reliable shipping across all areas in {location.name}. We ensure your products reach you safely and on time.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transition-transform hover:-translate-y-1 duration-300">
                <div className="mx-auto bg-cta/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform rotate-3">
                  <ShieldCheck className="h-8 w-8 text-cta" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">100% Authentic</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Every product we deliver to {location.name} is genuine and sourced directly from verified manufacturers.
                </p>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center transition-transform hover:-translate-y-1 duration-300">
                <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transform -rotate-3">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">Fast Service</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  Quick processing and dispatch. Need essential medicines in {location.name}? Count on us.
                </p>
              </div>
            </div>

            {/* Popular Categories in this District */}
            <div className="mb-16">
              <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">
                Popular Categories in {location.name}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/medicines" className="group relative rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-md p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary">Pharmacy & Medicines</h3>
                  <p className="text-sm text-gray-500 mt-2">Prescription & OTC items</p>
                </Link>
                <Link href="/category/cosmetics" className="group relative rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-md p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary">Premium Cosmetics</h3>
                  <p className="text-sm text-gray-500 mt-2">Skincare & beauty</p>
                </Link>
                <Link href="/category/baby-care" className="group relative rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-md p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary">Baby Care</h3>
                  <p className="text-sm text-gray-500 mt-2">Diapers & baby food</p>
                </Link>
                <Link href="/category/grocery" className="group relative rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100 hover:border-primary transition-all duration-300 hover:shadow-md p-6 text-center">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary">Daily Groceries</h3>
                  <p className="text-sm text-gray-500 mt-2">Essentials for your home</p>
                </Link>
              </div>
            </div>

            {/* Unions in this Upazila */}
            {unions.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">
                  Unions & Areas in {location.name}
                </h2>
                <p className="text-center text-gray-500 mb-8 font-medium">
                  Select your union for area-specific delivery info
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {unions.map((union) => (
                    <Link
                      key={union.id}
                      href={`/delivery/${districtSlug}/${thanaSlug}/${union.slug}`}
                      className="group flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-primary hover:shadow-md transition-all duration-300"
                    >
                      <div className="bg-primary/10 rounded-lg p-2 group-hover:bg-primary/20 transition-colors">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{union.name}</p>
                        <p className="text-xs text-gray-400">{location.name}, {location.districtName}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary ml-auto transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Text Section */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Why Choose Halalzi for Online Shopping in {location.name}, {location.districtName}?
              </h2>
              <div className="prose max-w-none text-gray-600">
                <p>
                  As one of Bangladesh's leading e-commerce platforms, Halalzi is dedicated to providing the residents of {location.name} with a seamless online shopping experience. Whether you need urgent medicines, everyday groceries, or premium cosmetic brands, our comprehensive catalog has everything you need.
                </p>
                <p className="mt-4">
                  We understand the importance of quality and authenticity. That's why every product dispatched to our customers in {location.name} undergoes strict quality checks. Enjoy the convenience of ordering from home and let our dedicated delivery network handle the rest.
                </p>
              </div>
              <div className="mt-8 text-center">
                <Link href="/delivery" className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors">
                  View all delivery locations across Bangladesh
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
