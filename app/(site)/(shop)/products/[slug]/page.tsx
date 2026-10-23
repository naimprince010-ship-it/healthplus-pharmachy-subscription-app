import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCachedProductBySlug } from "./get-product-by-slug";
import { isMedicineShopEnabled } from "@/lib/site-features";
import { getStorefrontImageUrl } from "@/lib/image-url";
import { resolveCategoryIconKey } from "@/lib/category-icon-key";
import { serializeJsonLd } from "@/lib/serialize-json-ld";
import { getEffectivePrices } from "@/lib/pricing";
import { getBasicSettings } from "@/lib/settings-server";
import { ProductImagePanel } from "@/components/product-detail/ProductImagePanel";
import { ProductPurchasePanel } from "@/components/product-detail/ProductPurchasePanel";
import { ProductMobileHeader } from "@/components/product-detail/ProductMobileHeader";
import { FrequentlyBoughtTogether } from "@/components/product-detail/FrequentlyBoughtTogether";
import { RecentlyViewed } from "@/components/product-detail/RecentlyViewed";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductRecommendationSections } from "./ProductRecommendationSections";

export const runtime = "nodejs";
export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };
const SITE = "https://halalzi.com";
const money = (n: number) =>
  `৳${Number.isInteger(n) ? n : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;

function summary(p: {
  name: string;
  brandName: string | null;
  sellingPrice: number;
  description: string | null;
}) {
  const base =
    `${p.name}${p.brandName ? ` — ${p.brandName}` : ""}, দাম ${money(p.sellingPrice)}। ${p.description || "Halalzi-তে অরিজিনাল পণ্যের দাম, বিস্তারিত ও সহজ অর্ডারের তথ্য দেখুন।"}`
      .replace(/\s+/g, " ")
      .trim();
  if (base.length > 160) return `${base.slice(0, 157).trimEnd()}…`;
  return base.length >= 150
    ? base
    : `${base} Halalzi থেকে অনলাইনে অর্ডার করুন।`.slice(0, 160);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getCachedProductBySlug(slug).catch(() => null);
  if (!p || !p.isActive || p.deletedAt)
    return { robots: { index: false, follow: false } };
  const title = p.seoTitle || `${p.name} — দাম ও বিস্তারিত | Halalzi`;
  const description = p.seoDescription || summary(p);
  const canonical = `${SITE}/products/${p.slug}`;
  const image = getStorefrontImageUrl(p.imageUrl);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: "Halalzi",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getCachedProductBySlug(slug).catch(() => null);
  if (!p || !p.isActive || p.deletedAt) notFound();
  if (
    !isMedicineShopEnabled() &&
    (p.type === "MEDICINE" || p.category.isMedicineCategory)
  )
    redirect("/products");

  const image = getStorefrontImageUrl(p.imageUrl);
  const prices = getEffectivePrices({
    sellingPrice: p.sellingPrice,
    mrp: p.mrp,
    discountPercentage: p.discountPercentage,
    flashSalePrice: p.flashSalePrice,
    flashSaleStart: p.flashSaleStart,
    flashSaleEnd: p.flashSaleEnd,
    isFlashSale: p.isFlashSale,
    campaignPrice: p.campaignPrice,
    campaignStart: p.campaignStart,
    campaignEnd: p.campaignEnd,
  });
  const [cartSettings, basic, co, reviewStats] = await Promise.all([
    prisma.cartPageSettings
      .findFirst({ select: { freeDeliveryThreshold: true } })
      .catch(() => null),
    getBasicSettings(),
    prisma.productCooccurrence
      .findMany({
        where: {
          anchorProductId: p.id,
          relatedProduct: {
            type: "GENERAL",
            isActive: true,
            deletedAt: null,
            stockQuantity: { gt: 0 },
            medicine: { is: null },
            category: { isMedicineCategory: false },
          },
        },
        orderBy: { coOrderCount: "desc" },
        take: 2,
        select: {
          relatedProduct: {
            select: {
              id: true,
              name: true,
              slug: true,
              sellingPrice: true,
              mrp: true,
              discountPercentage: true,
              flashSalePrice: true,
              flashSaleStart: true,
              flashSaleEnd: true,
              isFlashSale: true,
              campaignPrice: true,
              campaignStart: true,
              campaignEnd: true,
              imageUrl: true,
              category: { select: { name: true } },
            },
          },
        },
      })
      .catch(() => []),
    prisma.review
      .aggregate({
        where: { productId: p.id, isApproved: true },
        _avg: { rating: true },
        _count: { rating: true },
      })
      .catch(() => null),
  ]);
  const variants = p.variants.map((v) => ({
    ...v,
    mrp: v.mrp == null ? null : Number(v.mrp),
    sellingPrice: Number(v.sellingPrice),
    discountPercentage:
      v.discountPercentage == null ? null : Number(v.discountPercentage),
    unitLabel: v.unitLabel || `/${v.variantName}`,
  }));
  const canonical = `${SITE}/products/${p.slug}`;
  const aggregate =
    reviewStats && reviewStats._count.rating > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(reviewStats._avg.rating || 0).toFixed(1),
          reviewCount: reviewStats._count.rating,
        }
      : undefined;
  const brandName = p.brandName || p.manufacturer?.name;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(image ? { image: [image] } : {}),
    description: p.description || `${p.name} — Halalzi-তে দাম ও বিস্তারিত।`,
    ...(brandName ? { brand: { "@type": "Brand", name: brandName } } : {}),
    sku: p.supplierSku || p.id,
    offers: {
      "@type": "Offer",
      price: prices.price,
      priceCurrency: "BDT",
      availability:
        p.stockQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: canonical,
    },
    url: canonical,
    ...(aggregate ? { aggregateRating: aggregate } : {}),
  };
  const crumbs = [
    { name: "হোম", url: SITE },
    { name: p.category.name, url: `${SITE}/category/${p.category.slug}` },
    { name: p.name, url: canonical },
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: b.url,
    })),
  };
  const info = [
    ["ব্র্যান্ড", p.brandName],
    ["ক্যাটাগরি", p.category.name],
    ["সাইজ", p.sizeLabel],
    ["ভেরিয়েন্ট", p.variantLabel],
    ["প্রস্তুতকারক", p.manufacturer?.name],
  ].filter((r): r is [string, string] => Boolean(r[1]));
  const features =
    p.keyFeatures
      ?.split(/\r?\n/)
      .map((s) => s.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean) || [];
  const related = co.map(({ relatedProduct }) => {
    const relatedPrices = getEffectivePrices({
      sellingPrice: Number(relatedProduct.sellingPrice),
      mrp: relatedProduct.mrp == null ? null : Number(relatedProduct.mrp),
      discountPercentage:
        relatedProduct.discountPercentage == null
          ? null
          : Number(relatedProduct.discountPercentage),
      flashSalePrice:
        relatedProduct.flashSalePrice == null
          ? null
          : Number(relatedProduct.flashSalePrice),
      flashSaleStart: relatedProduct.flashSaleStart,
      flashSaleEnd: relatedProduct.flashSaleEnd,
      isFlashSale: relatedProduct.isFlashSale,
      campaignPrice:
        relatedProduct.campaignPrice == null
          ? null
          : Number(relatedProduct.campaignPrice),
      campaignStart: relatedProduct.campaignStart,
      campaignEnd: relatedProduct.campaignEnd,
    });

    return {
      id: relatedProduct.id,
      name: relatedProduct.name,
      slug: relatedProduct.slug,
      price: relatedPrices.price,
      imageUrl: getStorefrontImageUrl(relatedProduct.imageUrl),
      category: relatedProduct.category.name,
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
      <ProductMobileHeader
        category={p.category.name}
        name={p.name}
        url={canonical}
      />
      <div className="bg-slate-50 pb-28 lg:pb-16">
        <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:py-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 hidden text-sm text-slate-600 lg:block"
          >
            <ol className="flex min-w-0 items-center gap-2">
              <li>
                <Link href="/">হোম</Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href={`/category/${p.category.slug}`}>
                  {p.category.name}
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li className="truncate text-slate-900">{p.name}</li>
            </ol>
          </nav>
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="lg:sticky lg:top-32">
              <ProductImagePanel
                name={p.name}
                imageUrl={image}
                iconKey={resolveCategoryIconKey(
                  p.category.slug,
                  p.category.name,
                )}
              />
            </div>
            <article className="rounded-2xl bg-white p-5 shadow-sm sm:p-7">
              <p className="mb-2 text-sm font-semibold text-teal-700">
                {p.category.name}
              </p>
              <h1 className="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {p.name}
              </h1>
              {p.brandName && (
                <p className="mt-2 text-sm text-slate-600">
                  ব্র্যান্ড: {p.brandName}
                </p>
              )}
              <div className="my-5 border-t" />
              <ProductPurchasePanel
                productId={p.id}
                name={p.name}
                slug={p.slug}
                imageUrl={image}
                category={p.category.name}
                sellingPrice={Number(p.sellingPrice)}
                mrp={p.mrp == null ? null : Number(p.mrp)}
                stockQuantity={p.stockQuantity}
                discountPercentage={
                  p.discountPercentage == null
                    ? null
                    : Number(p.discountPercentage)
                }
                flashSalePrice={
                  p.flashSalePrice == null ? null : Number(p.flashSalePrice)
                }
                flashSaleStart={p.flashSaleStart?.toISOString() || null}
                flashSaleEnd={p.flashSaleEnd?.toISOString() || null}
                isFlashSale={p.isFlashSale}
                campaignPrice={
                  p.campaignPrice == null ? null : Number(p.campaignPrice)
                }
                campaignStart={p.campaignStart?.toISOString() || null}
                campaignEnd={p.campaignEnd?.toISOString() || null}
                variants={variants}
                freeDeliveryThreshold={
                  cartSettings?.freeDeliveryThreshold ?? null
                }
                whatsappNumber={(
                  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || basic.storePhone
                ).trim()}
              />
            </article>
          </div>
          <div className="mt-8 space-y-8">
            {related.length > 0 && (
              <FrequentlyBoughtTogether
                anchor={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: prices.price,
                  imageUrl: image,
                  category: p.category.name,
                }}
                items={related}
              />
            )}
            {(p.description ||
              features.length ||
              p.ingredients ||
              info.length > 0) && (
              <section className="rounded-2xl bg-white p-5 sm:p-7">
                <h2 className="text-2xl font-bold">পণ্যের বিস্তারিত</h2>
                <div className="mt-4 divide-y">
                  {p.description && (
                    <details open className="py-4">
                      <summary className="min-h-11 cursor-pointer font-bold">
                        বিবরণ
                      </summary>
                      <p className="whitespace-pre-line text-slate-700">
                        {p.description}
                      </p>
                    </details>
                  )}
                  {features.length > 0 && (
                    <details className="py-4">
                      <summary className="min-h-11 cursor-pointer font-bold">
                        মূল বৈশিষ্ট্য
                      </summary>
                      <ul className="list-disc space-y-2 pl-5 text-slate-700">
                        {features.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {p.ingredients && (
                    <details className="py-4">
                      <summary className="min-h-11 cursor-pointer font-bold">
                        উপাদান
                      </summary>
                      <p className="whitespace-pre-line text-slate-700">
                        {p.ingredients}
                      </p>
                    </details>
                  )}
                  {info.length > 0 &&
                    (p.description || features.length || p.ingredients ? (
                      <details className="py-4">
                        <summary className="min-h-11 cursor-pointer font-bold">
                          পণ্যের তথ্য
                        </summary>
                        <table className="mt-2 w-full text-sm">
                          <tbody>
                            {info.map(([k, v]) => (
                              <tr key={k} className="border-b last:border-0">
                                <th className="py-3 text-left font-medium text-slate-500">
                                  {k}
                                </th>
                                <td className="py-3 text-right font-semibold">
                                  {v}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </details>
                    ) : (
                      <div className="py-4">
                        <h3 className="font-bold">পণ্যের তথ্য</h3>
                        <table className="mt-2 w-full text-sm">
                          <tbody>
                            {info.map(([k, v]) => (
                              <tr key={k} className="border-b last:border-0">
                                <th className="py-3 text-left font-medium text-slate-500">
                                  {k}
                                </th>
                                <td className="py-3 text-right font-semibold">
                                  {v}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                </div>
              </section>
            )}
            <ProductRecommendationSections
              productId={p.id}
              categoryId={p.category.id}
              brandName={p.brandName}
            />
            <RecentlyViewed
              current={{
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: prices.price,
              }}
            />
            <section className="rounded-2xl bg-white p-5 sm:p-7">
              <ProductReviews productId={p.id} />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
