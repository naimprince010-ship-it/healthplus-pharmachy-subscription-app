import { prisma } from '@/lib/prisma'
import { ProductCard } from '@/components/ProductCard'
import { getSimilarProducts } from './get-similar-products'

export async function SimilarProductsSection({
  productId,
  categoryId,
  brandName,
}: {
  productId: string
  categoryId: string | null
  brandName: string | null
}) {
  let similarProducts: Awaited<ReturnType<typeof getSimilarProducts>> = []
  try {
    similarProducts = await getSimilarProducts(prisma, productId, categoryId, brandName)
  } catch (e) {
    console.error('Error in SimilarProductsSection for product', productId, e)
    return null
  }

  if (!similarProducts.length) return null

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">সমজাতীয় প্রোডাক্ট</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {similarProducts.map((item) => (
          <ProductCard key={item.id} product={item} variant="compact" />
        ))}
      </div>
    </section>
  )
}
