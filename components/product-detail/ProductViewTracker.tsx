"use client";

import { useEffect, useRef } from "react";
import { trackProductView } from "@/lib/trackEvent";

export function ProductViewTracker({
  id,
  name,
  price,
  category,
}: {
  id: string;
  name: string;
  price: number;
  category: string;
}) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackProductView({
      item_id: id,
      item_name: name,
      price,
      item_category: category,
    });
  }, [category, id, name, price]);
  return null;
}
