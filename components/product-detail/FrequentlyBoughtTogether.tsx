"use client";
import { useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
type Item = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  category: string;
};
const money = (n: number) => `৳${Number.isInteger(n) ? n : n.toFixed(2)}`;
export function FrequentlyBoughtTogether({
  anchor,
  items,
}: {
  anchor: Item;
  items: Item[];
}) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState(
    () => new Set(items.map((i) => i.id)),
  );
  const chosen = items.filter((i) => selected.has(i.id));
  const total = useMemo(
    () => anchor.price + chosen.reduce((s, i) => s + i.price, 0),
    [anchor.price, chosen],
  );
  if (!items.length) return null;
  const addAll = () =>
    [anchor, ...chosen].forEach((i) =>
      addItem({
        id: i.id,
        productId: i.id,
        name: i.name,
        price: i.price,
        image: i.imageUrl ?? undefined,
        type: "PRODUCT",
        quantity: 1,
        category: i.category,
        slug: i.slug,
      }),
    );
  return (
    <section className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
      <h2 className="text-xl font-bold">একসাথে কেনা হয়</h2>
      <div className="mt-4 space-y-3">
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked readOnly className="h-5 w-5" />
          <span className="flex-1 font-semibold">{anchor.name}</span>
          <span>{money(anchor.price)}</span>
        </label>
        {items.map((i) => (
          <label key={i.id} className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={selected.has(i.id)}
              onChange={() =>
                setSelected((s) => {
                  const n = new Set(s);
                  if (n.has(i.id)) n.delete(i.id);
                  else n.add(i.id);
                  return n;
                })
              }
            />
            <span className="flex-1">{i.name}</span>
            <span>{money(i.price)}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-orange-200 pt-4">
        <strong>মোট {money(total)}</strong>
        <button
          type="button"
          onClick={addAll}
          className="min-h-11 rounded-xl bg-teal-700 px-5 font-bold text-white"
        >
          সব কার্টে যোগ
        </button>
      </div>
    </section>
  );
}
