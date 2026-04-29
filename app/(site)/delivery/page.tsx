import Link from 'next/link'
import { MAIN_CONTAINER } from '@/lib/layout'
import { districts } from '@/lib/districts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delivery Locations in Bangladesh | Halalzi',
  description: 'Halalzi provides fast home delivery of authentic medicines, cosmetics, and groceries across all 64 districts in Bangladesh.',
  alternates: {
    canonical: '/delivery',
  },
}

export default function DeliveryLocationsIndexPage() {
  // Group districts alphabetically
  const groupedDistricts = districts.reduce((acc, district) => {
    const firstLetter = district.name[0].toUpperCase()
    if (!acc[firstLetter]) acc[firstLetter] = []
    acc[firstLetter].push(district)
    return acc
  }, {} as Record<string, typeof districts>)

  const sortedLetters = Object.keys(groupedDistricts).sort()

  return (
    <div className="bg-gray-50 py-12">
      <div className={MAIN_CONTAINER}>
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Our Delivery Locations
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Halalzi delivers authentic medicines, cosmetics, groceries, and baby care products to all 64 districts in Bangladesh. Find your city below to learn more about our fast delivery service.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sortedLetters.map((letter) => (
              <div key={letter} className="mb-6">
                <h2 className="text-xl font-bold text-teal-600 border-b border-gray-100 pb-2 mb-3">
                  {letter}
                </h2>
                <ul className="space-y-2">
                  {groupedDistricts[letter].map((district) => (
                    <li key={district.slug}>
                      <Link 
                        href={`/delivery/${district.slug}`}
                        className="text-gray-700 hover:text-teal-600 hover:underline transition-colors block py-1"
                      >
                        {district.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
