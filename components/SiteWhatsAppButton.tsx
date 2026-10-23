"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "@/components/WhatsAppButton";

interface SiteWhatsAppButtonProps {
  phone?: string;
}

export function SiteWhatsAppButton({ phone }: SiteWhatsAppButtonProps) {
  const pathname = usePathname();

  // Hide global WhatsApp button on cart page (cart has its own floating chat widget)
  if (pathname === "/cart") {
    return null;
  }

  const isProductDetail = /^\/products\/[^/]+\/?$/.test(pathname);

  return (
    <WhatsAppButton
      phone={phone}
      className={isProductDetail ? "hidden lg:block" : ""}
    />
  );
}
