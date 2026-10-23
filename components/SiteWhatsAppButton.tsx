"use client";

import { usePathname } from "next/navigation";
import { WhatsAppButton } from "@/components/WhatsAppButton";

interface SiteWhatsAppButtonProps {
  phone?: string;
}

export function SiteWhatsAppButton({ phone }: SiteWhatsAppButtonProps) {
  const pathname = usePathname();

  // Cart and product detail pages already provide their own contextual actions.
  if (pathname === "/cart" || /^\/products\/[^/]+\/?$/.test(pathname)) {
    return null;
  }

  return <WhatsAppButton phone={phone} />;
}
