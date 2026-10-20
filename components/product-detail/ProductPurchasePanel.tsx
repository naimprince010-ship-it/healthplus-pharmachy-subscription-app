"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Minus, Plus, ShoppingCart, Truck } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { getEffectivePrices } from "@/lib/pricing";

type Variant = {
  id: string;
  variantName: string;
  unitLabel: string;
  sizeLabel: string | null;
  mrp: number | null;
  sellingPrice: number;
  discountPercentage: number | null;
  stockQuantity: number;
  isDefault: boolean;
};
type Props = {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: string;
  sellingPrice: number;
  mrp: number | null;
  stockQuantity: number;
  discountPercentage: number | null;
  flashSalePrice: number | null;
  flashSaleStart: string | null;
  flashSaleEnd: string | null;
  isFlashSale: boolean;
  campaignPrice: number | null;
  campaignStart: string | null;
  campaignEnd: string | null;
  variants: Variant[];
  freeDeliveryThreshold: number | null;
  whatsappNumber: string;
};
const money = (n: number) =>
  `৳${Number.isInteger(n) ? n : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}`;

export function ProductPurchasePanel(p: Props) {
  const router = useRouter();
  const { addItem, total } = useCart();
  const [qty, setQty] = useState(1);
  const anchor = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  const first = p.variants.find((v) => v.isDefault) ?? p.variants[0] ?? null;
  const [variantId, setVariantId] = useState(first?.id ?? null);
  const variant = p.variants.find((v) => v.id === variantId) ?? first;
  const base = useMemo(
    () =>
      getEffectivePrices({
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
      }),
    [p],
  );
  const price = variant ? variant.sellingPrice : base.price;
  const effectiveMrp = variant?.mrp ?? base.mrp;
  const discount = variant?.discountPercentage ?? base.discountPercent;
  const stock = variant?.stockQuantity ?? p.stockQuantity;
  const out = stock <= 0;
  useEffect(() => {
    const node = anchor.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([e]) => setSticky(!e.isIntersecting),
      { rootMargin: "-90px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const add = (checkout = false) => {
    if (out) return;
    addItem({
      id: variant ? `${p.productId}-${variant.id}` : p.productId,
      productId: p.productId,
      variantId: variant?.id,
      variantLabel: variant?.variantName,
      name: variant ? `${p.name} — ${variant.variantName}` : p.name,
      price,
      quantity: qty,
      image: p.imageUrl ?? undefined,
      type: "PRODUCT",
      category: p.category,
      mrp: effectiveMrp,
      slug: p.slug,
      unitLabelBn: variant?.unitLabel,
    });
    if (checkout) router.push("/checkout");
  };
  const remaining = p.freeDeliveryThreshold
    ? Math.max(0, p.freeDeliveryThreshold - total)
    : 0;
  const progress = p.freeDeliveryThreshold
    ? Math.min(100, (total / p.freeDeliveryThreshold) * 100)
    : 0;
  const wa = p.whatsappNumber.replace(/\D/g, "");
  const message = encodeURIComponent(
    `${p.name}\nhttps://halalzi.com/products/${p.slug}`,
  );
  return (
    <div className="space-y-5">
      <div ref={anchor}>
        <div className="flex flex-wrap items-center gap-3">
          <strong className="text-3xl text-[#0B4F4A]">{money(price)}</strong>
          {discount > 0 && effectiveMrp > price && (
            <>
              <span className="text-sm text-slate-500 line-through">
                {money(effectiveMrp)}
              </span>
              <span className="rounded-md bg-[#C2410C] px-2 py-1 text-xs font-bold text-white">
                -{Math.round(discount)}%
              </span>
            </>
          )}
        </div>
        {stock > 0 && stock <= 5 && (
          <p className="mt-2 text-sm font-semibold text-red-700">
            মাত্র {stock}টি বাকি
          </p>
        )}
        {out && <p className="mt-2 font-bold text-red-700">স্টক শেষ</p>}
      </div>
      {p.variants.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-700">
            ভেরিয়েন্ট
          </legend>
          <div className="flex flex-wrap gap-2">
            {p.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                disabled={v.stockQuantity <= 0}
                onClick={() => {
                  setVariantId(v.id);
                  setQty(1);
                }}
                className={`min-h-11 rounded-xl border px-4 text-sm font-semibold disabled:opacity-40 ${v.id === variant?.id ? "border-teal-700 bg-teal-50 text-teal-900" : "border-slate-200 bg-white"}`}
              >
                {v.variantName} · {money(v.sellingPrice)}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {!out && (
        <div className="flex h-12 w-36 items-center rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center"
            aria-label="পরিমাণ কমান"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex-1 text-center font-bold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(stock, q + 1))}
            className="flex h-11 w-11 items-center justify-center"
            aria-label="পরিমাণ বাড়ান"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={out}
          onClick={() => add()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
        >
          <ShoppingCart className="h-5 w-5" />
          {out ? "স্টক শেষ" : "কার্টে যোগ করুন"}
        </button>
        <button
          type="button"
          disabled={out}
          onClick={() => add(true)}
          className="min-h-12 rounded-xl bg-[#C2410C] px-5 font-bold text-white disabled:bg-slate-200 disabled:text-slate-500"
        >
          এখনই কিনুন
        </button>
      </div>
      {wa && (
        <a
          href={`https://api.whatsapp.com/send?phone=${wa}&text=${message}`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-700 font-bold text-teal-800"
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp-এ অর্ডার
        </a>
      )}
      {p.freeDeliveryThreshold && p.freeDeliveryThreshold > 0 && (
        <div className="rounded-xl bg-teal-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-teal-900">
            <Truck className="h-4 w-4" />
            {remaining > 0
              ? `আর ${money(Math.ceil(remaining))} কিনলেই ফ্রি ডেলিভারি`
              : "ফ্রি ডেলিভারি পাচ্ছেন ✓"}
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-teal-100">
            <div
              className="h-full bg-teal-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2" aria-label="পেমেন্ট পদ্ধতি">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold">
          ক্যাশ অন ডেলিভারি
        </span>
      </div>
      {sticky && !out && (
        <>
          <div className="fixed inset-x-0 bottom-0 z-50 hidden border-t bg-white px-6 py-3 shadow-2xl lg:block">
            <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                <strong className="text-teal-900">{money(price)}</strong>
              </div>
              <button
                type="button"
                onClick={() => add()}
                className="min-h-11 rounded-xl bg-teal-700 px-8 font-bold text-white"
              >
                কার্টে যোগ করুন
              </button>
            </div>
          </div>
          <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-[auto_1fr_1fr] gap-2 border-t bg-white p-2 pb-[calc(.5rem+env(safe-area-inset-bottom))] shadow-2xl lg:hidden">
            <div className="flex h-12 items-center rounded-xl border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-11 w-10"
                aria-label="পরিমাণ কমান"
              >
                −
              </button>
              <span className="w-7 text-center font-bold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(stock, q + 1))}
                className="h-11 w-10"
                aria-label="পরিমাণ বাড়ান"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => add()}
              className="h-12 rounded-xl bg-teal-700 text-sm font-bold text-white"
            >
              কার্টে যোগ
            </button>
            <button
              type="button"
              onClick={() => add(true)}
              className="h-12 rounded-xl bg-[#C2410C] text-sm font-bold text-white"
            >
              এখনই কিনুন
            </button>
          </div>
        </>
      )}
    </div>
  );
}
