import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardProps } from "@/components/ProductCard";
import { getEffectivePrices } from "@/lib/pricing";
import type { Prisma } from "@prisma/client";

const select = {
  id: true,
  type: true,
  name: true,
  slug: true,
  brandName: true,
  description: true,
  sellingPrice: true,
  mrp: true,
  stockQuantity: true,
  imageUrl: true,
  discountPercentage: true,
  flashSalePrice: true,
  flashSaleStart: true,
  flashSaleEnd: true,
  isFlashSale: true,
  campaignPrice: true,
  campaignStart: true,
  campaignEnd: true,
  sizeLabel: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;
type RecommendationProduct = Prisma.ProductGetPayload<{
  select: typeof select;
}>;
function map(p: RecommendationProduct): ProductCardProps {
  const e = getEffectivePrices(p);
  return {
    ...p,
    type: p.type as "MEDICINE" | "GENERAL",
    effectivePrice: e.price,
    effectiveMrp: e.mrp,
    effectiveDiscountPercent: e.discountPercent,
    isFlashSaleActive: e.isFlashSale,
    cartInfo: { kind: "product", productId: p.id },
  };
}
function Grid({ title, items }: { title: string; items: ProductCardProps[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {items.map((i) => (
          <ProductCard key={i.id} product={i} variant="compact" />
        ))}
      </div>
    </section>
  );
}
export async function ProductRecommendationSections({
  productId,
  categoryId,
  brandName,
}: {
  productId: string;
  categoryId: string;
  brandName: string | null;
}) {
  const safe = {
    id: { not: productId },
    type: "GENERAL" as const,
    isActive: true,
    deletedAt: null,
    stockQuantity: { gt: 0 },
    medicine: { is: null },
    category: { isMedicineCategory: false },
  };
  const [similar, brand] = await Promise.all([
    prisma.product
      .findMany({
        where: { ...safe, categoryId },
        select,
        take: 5,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      })
      .catch(() => []),
    brandName
      ? prisma.product
          .findMany({
            where: { ...safe, brandName },
            select,
            take: 5,
            orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);
  return (
    <div className="space-y-10">
      <Grid title="একই ধরনের পণ্য" items={similar.map(map)} />
      <Grid title={`${brandName}-এর আরও পণ্য`} items={brand.map(map)} />
    </div>
  );
}
