"use client";
import Link from "next/link";
import { ArrowLeft, Search, Share2, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

export function ProductMobileHeader({
  category,
  name,
  url,
}: {
  category: string;
  name: string;
  url: string;
}) {
  const router = useRouter();
  const { itemCount, openDrawer } = useCart();
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-1 border-b bg-white px-2 lg:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex h-11 w-11 items-center justify-center"
        aria-label="পেছনে যান"
      >
        <ArrowLeft />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
        {category}
      </span>
      <Link
        href="/search"
        className="flex h-11 w-11 items-center justify-center"
        aria-label="খুঁজুন"
      >
        <Search />
      </Link>
      <button
        type="button"
        onClick={async () => {
          try {
            if (navigator.share) await navigator.share({ title: name, url });
            else await navigator.clipboard.writeText(url);
          } catch {}
        }}
        className="flex h-11 w-11 items-center justify-center"
        aria-label="শেয়ার করুন"
      >
        <Share2 />
      </button>
      <button
        type="button"
        onClick={openDrawer}
        className="relative flex h-11 w-11 items-center justify-center"
        aria-label="কার্ট খুলুন"
      >
        <ShoppingCart />
        {itemCount > 0 && (
          <span className="absolute right-0 top-0 rounded-full bg-red-600 px-1.5 text-[10px] text-white">
            {itemCount}
          </span>
        )}
      </button>
    </header>
  );
}
