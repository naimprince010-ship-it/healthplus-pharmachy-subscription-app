import { prisma } from '@/lib/prisma'
import { ProductCard } from './ProductCard'

interface GenericAlternativesProps {
    genericName: string
    currentProductId: string
}

export async function GenericAlternatives({ genericName, currentProductId }: GenericAlternativesProps) {
    if (!genericName) return null

    // Fetch other medicines with the same generic name
    const alternatives = await prisma.product.findMany({
        where: {
            isActive: true,
            deletedAt: null,
            id: { not: currentProductId },
            medicine: {
                genericName: {
                    equals: genericName,
                    mode: 'insensitive'
                }
            }
        },
        include: {
            category: true,
            medicine: true,
        },
        orderBy: {
            sellingPrice: 'asc'
        },
        take: 5
    })

    if (alternatives.length === 0) return null

    return (
        <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                সাশ্রয়ী বিকল্প (Cheaper Alternatives)
                <span className="text-sm font-normal text-gray-500">(একই জেনেরিক)</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {alternatives.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={{
                            id: product.id,
                            type: product.type,
                            name: product.name,
                            slug: product.slug,
                            brandName: product.medicine?.manufacturer || product.brandName,
                            description: product.description,
                            sellingPrice: product.sellingPrice,
                            mrp: product.mrp,
                            stockQuantity: product.stockQuantity,
                            imageUrl: product.imageUrl,
                            discountPercentage: product.discountPercentage,
                            sizeLabel: product.sizeLabel ?? null,
                            packSize: product.medicine?.packSize ?? null,
                            category: {
                                id: product.category.id,
                                name: product.category.name,
                                slug: product.category.slug
                            }
                        }}
                        variant="compact"
                    />
                ))}
            </div>
        </section>
    )
}
