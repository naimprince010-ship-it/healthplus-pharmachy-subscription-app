"use client";

import Image from "next/image";
import { useState } from "react";
import { Maximize2, X } from "lucide-react";
import { CategoryIconByKey } from "@/components/icons/CategoryIcons";
import type { CategoryIconKey } from "@/lib/category-icon-key";

export function ProductImagePanel({
  name,
  imageUrl,
  iconKey,
}: {
  name: string;
  imageUrl: string | null;
  iconKey: CategoryIconKey;
}) {
  const [failed, setFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const hasImage = Boolean(imageUrl && !failed);
  return (
    <>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-100 bg-[#F8FAFC]">
        {hasImage ? (
          <Image
            src={imageUrl!}
            alt={name}
            fill
            priority
            sizes="(max-width:1023px) 100vw, 620px"
            className="object-contain p-5"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#FDF2F4] text-teal-700/40">
            <CategoryIconByKey iconKey={iconKey} className="h-24 w-24" />
          </div>
        )}
        {hasImage && (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <Maximize2 className="h-4 w-4" />
            বড় করে দেখুন
          </button>
        )}
      </div>
      {zoomed && hasImage && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} বড় ছবি`}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-800"
            aria-label="বন্ধ করুন"
          >
            <X />
          </button>
          <div className="relative h-[85vh] w-[min(92vw,900px)]">
            <Image
              src={imageUrl!}
              alt={name}
              fill
              sizes="92vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
