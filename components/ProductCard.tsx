"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AddToCartButton } from "@/components/AddToCartButton";
import { CategoryIcon } from "@/components/icons/CategoryIcons";
import { getEffectivePrices } from "@/lib/pricing";
import { getStorefrontImageUrl } from "@/lib/image-url";
import { resolveCategoryIconKey } from "@/lib/category-icon-key";
import { isMedicineShopEnabled } from "@/lib/site-features";

export interface ProductCardProps {
  id: string;
  type: "MEDICINE" | "GENERAL";
  name: string;
  slug: string;
  brandName: string | null;
  description: string | null;
  sellingPrice: number;
  mrp: number | null;
  stockQuantity: number;
  imageUrl: string | null;
  discountPercentage?: number | null;
  flashSalePrice?: number | null;
  flashSaleStart?: Date | string | null;
  flashSaleEnd?: Date | string | null;
  isFlashSale?: boolean | null;
  campaignPrice?: number | null;
  campaignStart?: Date | string | null;
  campaignEnd?: Date | string | null;
  requiresPrescription?: boolean;
  genericName?: string | null;
  // Pre-computed values from server to avoid hydration mismatch
  effectivePrice?: number;
  effectiveMrp?: number;
  effectiveDiscountPercent?: number;
  isFlashSaleActive?: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  /** e.g. "100ml", "539g" — shown on its own line so the title can stay short. */
  sizeLabel?: string | null;
  /** Medicine pack line when linked to Medicine row */
  packSize?: string | null;
  href?: string;
  cartInfo?: {
    kind: "medicine" | "product";
    medicineId?: string;
    productId?: string;
  };
}

interface ProductCardComponentProps {
  product: ProductCardProps;
  variant?: "default" | "compact";
  className?: string;
  /** First above-the-fold cards only — boosts LCP via next/image preload (few per viewport). */
  imagePriority?: boolean;
  /** Use outline cart CTA — better visual balance on dense grids (e.g. search). */
  cartButtonVariant?: "solid" | "outline";
  analyticsSource?: "similar" | "brand" | "recent";
}

export function ProductCard({
  product,
  variant = "default",
  className = "",
  imagePriority = false,
  analyticsSource,
}: ProductCardComponentProps) {
  const href =
    product.href ||
    (product.type === "MEDICINE"
      ? `/medicines/${product.slug}`
      : `/products/${product.slug}`);

  let medicineId: string | undefined;
  let productId: string | undefined;
  if (product.cartInfo?.kind === "medicine") {
    medicineId = product.cartInfo.medicineId;
  } else if (product.cartInfo?.kind === "product") {
    productId = product.cartInfo.productId;
  } else if (product.type === "MEDICINE") {
    medicineId = product.id;
  } else {
    productId = product.id;
  }

  const isCompact = variant === "compact";
  const displayImageUrl = getStorefrontImageUrl(product.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const sizeDisplay =
    product.sizeLabel?.trim() || product.packSize?.trim() || null;
  const metadata = [sizeDisplay, product.brandName?.trim()]
    .filter(Boolean)
    .join(" · ");
  const iconKey = resolveCategoryIconKey(
    product.category.slug,
    product.category.name,
  );
  const imageTone = [
    "makeup",
    "fragrance",
    "body",
    "feminine",
    "cosmetics",
  ].includes(iconKey)
    ? "bg-[#FDF2F4]"
    : ["skincare", "hair"].includes(iconKey)
      ? "bg-[#F0FDFA]"
      : ["grocery", "fresh", "deals"].includes(iconKey)
        ? "bg-[#FFF7ED]"
        : "bg-[#F8FAFC]";

  // Use pre-computed values from server if available (avoids hydration mismatch)
  // Fall back to computing on client for pages that don't pre-compute
  let price: number;
  let mrp: number;
  let discountPercent: number;
  let isFlashActive: boolean;

  if (product.effectivePrice !== undefined) {
    // Use pre-computed values from server
    price = product.effectivePrice;
    mrp = product.effectiveMrp ?? product.mrp ?? product.sellingPrice;
    discountPercent = product.effectiveDiscountPercent ?? 0;
    isFlashActive = product.isFlashSaleActive ?? false;
  } else {
    // Fall back to computing on client (for pages that don't pre-compute)
    const computed = getEffectivePrices({
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      discountPercentage: product.discountPercentage,
      flashSalePrice: product.flashSalePrice,
      flashSaleStart: product.flashSaleStart,
      flashSaleEnd: product.flashSaleEnd,
      isFlashSale: product.isFlashSale,
      campaignPrice: product.campaignPrice,
      campaignStart: product.campaignStart,
      campaignEnd: product.campaignEnd,
    });
    price = computed.price;
    mrp = computed.mrp;
    discountPercent = computed.discountPercent;
    isFlashActive = computed.isFlashSale;
  }

  const hasDiscount = discountPercent > 0;
  const formatPrice = (value: number) =>
    Number.isInteger(value)
      ? value.toFixed(0)
      : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");

  return (
    <article
      className={`group relative flex h-full min-h-0 w-full min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-2.5 transition-[border-color,box-shadow] duration-300 hover:border-teal-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-3 ${className}`}
    >
      <Link
        href={href}
        prefetch
        className={`relative aspect-square shrink-0 overflow-hidden rounded-xl p-2 ${imageTone}`}
      >
        <span className="sr-only">{product.name}</span>
        <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
          {hasDiscount && (
            <span className="rounded-md bg-[#C2410C] px-1.5 py-0.5 text-[11px] font-bold text-white">
              -{Math.round(discountPercent)}%
            </span>
          )}
          {isFlashActive && (
            <span className="rounded-md bg-orange-100 px-1.5 py-0.5 text-[11px] font-bold text-[#C2410C]">
              ফ্ল্যাশ
            </span>
          )}
        </div>
        {displayImageUrl && !imageFailed ? (
          <Image
            src={displayImageUrl}
            alt=""
            fill
            onError={() => setImageFailed(true)}
            priority={imagePriority}
            sizes={
              isCompact
                ? "(max-width: 768px) 50vw, 190px"
                : "(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 320px"
            }
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center opacity-40"
            aria-hidden
          >
            <CategoryIcon
              slug={product.category.slug}
              name={product.category.name}
              size={48}
            />
          </div>
        )}
        {product.requiresPrescription && isMedicineShopEnabled() && (
          <span className="absolute right-2 top-2 z-10 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            Rx
          </span>
        )}
        {product.stockQuantity > 0 && product.stockQuantity <= 5 && (
          <span className="absolute bottom-2 right-2 z-10 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
            মাত্র {product.stockQuantity}টি বাকি
          </span>
        )}
      </Link>

      <div
        className={`flex min-h-0 flex-1 flex-col ${isCompact ? "mt-2.5" : "mt-3"}`}
      >
        <h3 className="min-h-[2.5rem] shrink-0 text-[13.5px] font-semibold leading-5 text-slate-900">
          <Link
            href={href}
            prefetch
            className="line-clamp-2 hover:text-teal-800"
          >
            {product.name}
          </Link>
        </h3>
        <div className="mt-0.5 min-h-[18px]">
          {metadata && (
            <p
              className="truncate text-xs font-normal text-slate-500"
              title={metadata}
            >
              {metadata}
            </p>
          )}
        </div>

        <div className="mt-auto pt-1">
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            <span className="text-[17px] font-bold tabular-nums text-teal-900">
              ৳{formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-xs font-medium text-slate-500 line-through">
                ৳{formatPrice(mrp)}
              </span>
            )}
          </div>

          <div className="pt-2">
            <AddToCartButton
              medicineId={medicineId}
              productId={productId}
              name={product.name}
              price={price}
              image={displayImageUrl || undefined}
              requiresPrescription={product.requiresPrescription}
              stockQuantity={product.stockQuantity}
              category={product.category.name}
              genericName={product.genericName ?? undefined}
              mrp={mrp}
              slug={product.slug}
              analyticsSource={analyticsSource}
              type={product.type === "MEDICINE" ? "MEDICINE" : "PRODUCT"}
              variant="solid"
              className="h-11 w-full rounded-[10px]"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
