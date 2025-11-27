import { prisma } from '@/lib/prisma'
import { ProductType } from '@prisma/client'

interface MedicineData {
  id: string
  name: string
  slug: string
  genericName?: string | null
  brandName?: string | null
  description?: string | null
  categoryId: string
  mrp?: number | null
  sellingPrice: number
  stockQuantity: number
  inStock: boolean
  imageUrl?: string | null
  imagePath?: string | null
  seoTitle?: string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  canonicalUrl?: string | null
  isFeatured: boolean
  isActive: boolean
  productId?: string | null
}

async function generateUniqueProductSlug(baseSlug: string, excludeProductId?: string): Promise<string> {
  let slug = baseSlug
  let counter = 1
  
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    })
    
    if (!existing || (excludeProductId && existing.id === excludeProductId)) {
      return slug
    }
    
    slug = `${baseSlug}-${counter}`
    counter++
  }
}

export async function syncMedicineToProduct(medicine: MedicineData): Promise<{ productId: string; created: boolean }> {
  const productData = {
    type: ProductType.MEDICINE,
    name: medicine.name,
    description: medicine.description,
    brandName: medicine.brandName,
    categoryId: medicine.categoryId,
    mrp: medicine.mrp,
    sellingPrice: medicine.sellingPrice,
    stockQuantity: medicine.stockQuantity,
    inStock: medicine.inStock,
    imageUrl: medicine.imageUrl,
    imagePath: medicine.imagePath,
    seoTitle: medicine.seoTitle,
    seoDescription: medicine.seoDescription,
    seoKeywords: medicine.seoKeywords,
    canonicalUrl: medicine.canonicalUrl,
    isFeatured: medicine.isFeatured,
    isActive: medicine.isActive,
  }

  if (medicine.productId) {
    const existingProduct = await prisma.product.findUnique({
      where: { id: medicine.productId },
      select: { id: true, slug: true },
    })

    if (existingProduct) {
      let slug = existingProduct.slug
      if (existingProduct.slug !== medicine.slug) {
        slug = await generateUniqueProductSlug(medicine.slug, existingProduct.id)
      }

      await prisma.product.update({
        where: { id: medicine.productId },
        data: {
          ...productData,
          slug,
        },
      })

      return { productId: medicine.productId, created: false }
    }
  }

  const slug = await generateUniqueProductSlug(medicine.slug)

  const result = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        ...productData,
        slug,
      },
    })

    await tx.medicine.update({
      where: { id: medicine.id },
      data: { productId: product.id },
    })

    return product
  })

  return { productId: result.id, created: true }
}

export async function deleteSyncedProduct(medicineId: string): Promise<void> {
  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
    select: { productId: true },
  })

  if (medicine?.productId) {
    await prisma.$transaction(async (tx) => {
      await tx.medicine.update({
        where: { id: medicineId },
        data: { productId: null },
      })

      await tx.product.delete({
        where: { id: medicine.productId! },
      })
    })
  }
}
