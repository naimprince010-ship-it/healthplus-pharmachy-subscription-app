import { prisma } from '@/lib/prisma'
import { Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function MedicinesPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string }
}) {
  const search = searchParams.search || ''
  const categoryId = searchParams.category || ''

  const where: any = {
    isActive: true,
    deletedAt: null,
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { genericName: { contains: search, mode: 'insensitive' } },
      { brandName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  const [medicines, categories] = await Promise.all([
    prisma.medicine.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 50,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Browse Medicines</h1>
          <form method="get" className="flex gap-2">
            <div className="relative">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Search medicines..."
                className="w-64 rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Search
            </button>
          </form>
        </div>

        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href="/medicines"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                !categoryId
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/medicines?category=${category.id}`}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  categoryId === category.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {medicines.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No medicines found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {medicines.map((medicine) => (
              <Link
                key={medicine.id}
                href={`/medicines/${medicine.slug}`}
                className="group rounded-lg border border-gray-200 p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-gray-100">
                  {medicine.imageUrl ? (
                    <Image
                      src={medicine.imageUrl}
                      alt={medicine.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                  {medicine.isFeatured && (
                    <span className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-1 text-xs font-semibold text-gray-900">
                      Featured
                    </span>
                  )}
                  {medicine.requiresPrescription && (
                    <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      Rx
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-teal-600">
                  {medicine.name}
                </h3>
                {medicine.genericName && (
                  <p className="mt-1 text-sm text-gray-600">{medicine.genericName}</p>
                )}
                {medicine.strength && (
                  <p className="mt-1 text-xs text-gray-500">{medicine.strength}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-gray-900">
                      ৳{medicine.sellingPrice.toFixed(2)}
                    </span>
                    {medicine.mrp && medicine.mrp > medicine.sellingPrice && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ৳{medicine.mrp.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                {medicine.stockQuantity === 0 && (
                  <p className="mt-2 text-xs text-red-600">Out of stock</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
