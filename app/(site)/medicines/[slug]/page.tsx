import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddToCartButton } from '@/components/AddToCartButton'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface MedicineDetailPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({
  params,
}: MedicineDetailPageProps): Promise<Metadata> {
  const medicine = await prisma.medicine.findUnique({
    where: { slug: params.slug },
  })

  if (!medicine) {
    return {
      title: 'Medicine Not Found',
    }
  }

  return {
    title: medicine.seoTitle || `${medicine.name} - HealthPlus`,
    description: medicine.seoDescription || medicine.description || undefined,
    keywords: medicine.seoKeywords || undefined,
    alternates: {
      canonical: medicine.canonicalUrl || undefined,
    },
    openGraph: {
      title: medicine.seoTitle || medicine.name,
      description: medicine.seoDescription || medicine.description || undefined,
      images: medicine.imageUrl ? [medicine.imageUrl] : undefined,
    },
  }
}

export default async function MedicineDetailPage({
  params,
}: MedicineDetailPageProps) {
  const medicine = await prisma.medicine.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!medicine || !medicine.isActive || medicine.deletedAt) {
    notFound()
  }

  const imageUrl =
    medicine.imageUrl ||
    (medicine.imagePath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/medicine-images/${medicine.imagePath}`
      : null)

  return (
    <div className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/medicines"
          className="mb-6 inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Medicines
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Section */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={medicine.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-24 w-24 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm">No image available</p>
                </div>
              </div>
            )}
            {medicine.isFeatured && (
              <span className="absolute right-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-sm font-semibold text-gray-900">
                Featured
              </span>
            )}
            {medicine.requiresPrescription && (
              <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                Prescription Required
              </span>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {medicine.name}
              </h1>
              {medicine.genericName && (
                <p className="mt-2 text-lg text-gray-600">
                  {medicine.genericName}
                </p>
              )}
              {medicine.brandName && (
                <p className="mt-1 text-sm text-gray-500">
                  Brand: {medicine.brandName}
                </p>
              )}
            </div>

            <div className="mb-6 space-y-2 border-b border-gray-200 pb-6">
              {medicine.manufacturer && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Manufacturer:
                  </span>
                  <span className="text-sm text-gray-600">
                    {medicine.manufacturer}
                  </span>
                </div>
              )}
              {medicine.strength && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Strength:
                  </span>
                  <span className="text-sm text-gray-600">
                    {medicine.strength}
                  </span>
                </div>
              )}
              {medicine.dosageForm && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Dosage Form:
                  </span>
                  <span className="text-sm text-gray-600">
                    {medicine.dosageForm}
                  </span>
                </div>
              )}
              {medicine.packSize && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Pack Size:
                  </span>
                  <span className="text-sm text-gray-600">
                    {medicine.packSize}
                  </span>
                </div>
              )}
              {medicine.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Category:
                  </span>
                  <Link
                    href={`/medicines?category=${medicine.category.id}`}
                    className="text-sm text-teal-600 hover:text-teal-700"
                  >
                    {medicine.category.name}
                  </Link>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-gray-900">
                  ৳{medicine.sellingPrice.toFixed(2)}
                </span>
                {medicine.mrp && medicine.mrp > medicine.sellingPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ৳{medicine.mrp.toFixed(2)}
                  </span>
                )}
              </div>
              {medicine.unitPrice && (
                <p className="mt-1 text-sm text-gray-600">
                  ৳{medicine.unitPrice.toFixed(2)} per unit
                </p>
              )}
            </div>

            <div className="mb-6">
              {medicine.stockQuantity > 0 ? (
                <p className="text-sm text-green-600">
                  In Stock ({medicine.stockQuantity} available)
                </p>
              ) : (
                <p className="text-sm text-red-600">Out of Stock</p>
              )}
            </div>

            <AddToCartButton
              medicineId={medicine.id}
              name={medicine.name}
              price={medicine.sellingPrice}
              image={imageUrl || undefined}
              requiresPrescription={medicine.requiresPrescription}
              stockQuantity={medicine.stockQuantity}
              className="w-full sm:w-auto"
            />

            {medicine.description && (
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Description
                </h2>
                <p className="text-gray-600">{medicine.description}</p>
              </div>
            )}

            {medicine.uses && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Uses
                </h2>
                <p className="text-gray-600">{medicine.uses}</p>
              </div>
            )}

            {medicine.sideEffects && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Side Effects
                </h2>
                <p className="text-gray-600">{medicine.sideEffects}</p>
              </div>
            )}

            {medicine.contraindications && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Contraindications
                </h2>
                <p className="text-gray-600">{medicine.contraindications}</p>
              </div>
            )}

            {medicine.storageInstructions && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  Storage Instructions
                </h2>
                <p className="text-gray-600">{medicine.storageInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
