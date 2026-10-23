"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { CategoryIcon } from "@/components/icons/CategoryIcons";

type Item = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  category: string;
};

export function RecentlyViewed({ current }: { current: Item }) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const updateRecentlyViewed = () => {
      try {
        const key = "halalzi_recent_products";
        const stored = JSON.parse(localStorage.getItem(key) || "[]") as Item[];
        const previous = stored.filter((item) => item.id !== current.id);
        setItems(previous.slice(0, 5));
        localStorage.setItem(
          key,
          JSON.stringify([current, ...previous].slice(0, 6)),
        );
      } catch {
        // Storage may be unavailable in private browsing or restricted contexts.
      }
    };

    const timeoutId = window.setTimeout(updateRecentlyViewed, 0);
    return () => window.clearTimeout(timeoutId);
  }, [current]);

  if (!items.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">সম্প্রতি দেখেছেন</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="rounded-xl border bg-white p-3"
          >
            <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-slate-50">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-contain p-2"
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center opacity-40"
                  aria-hidden
                >
                  <CategoryIcon name={item.category} className="h-12 w-12" />
                </div>
              )}
            </div>
            <p className="line-clamp-2 min-h-10 text-sm font-semibold">
              {item.name}
            </p>
            <strong className="mt-2 block text-teal-900">৳{item.price}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
