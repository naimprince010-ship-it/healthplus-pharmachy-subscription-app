import { MedEasyHeader } from "@/components/MedEasyHeader";
import { NavigationPrefetch } from "@/components/NavigationPrefetch";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteFooterWrapper } from "@/components/SiteFooterWrapper";
import { SiteWhatsAppButton } from "@/components/SiteWhatsAppButton";
import { SiteMobileNav } from "@/components/SiteMobileNav";
import TrackingProvider from "@/components/tracking/TrackingProvider";
import { getBasicSettings } from "@/lib/settings-server";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [basicSettings, cartSettings] = await Promise.all([
    getBasicSettings(),
    prisma.cartPageSettings.findFirst({ select: { freeDeliveryThreshold: true } }),
  ]);
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || basicSettings.storePhone).trim();

  return (
    <>
      <TrackingProvider />
      <NavigationPrefetch />
      <MedEasyHeader
        storeName={basicSettings.storeName}
        freeDeliveryThreshold={cartSettings?.freeDeliveryThreshold ?? null}
        whatsappNumber={whatsappNumber}
      />
      <main className="min-h-screen">{children}</main>
      <SiteFooterWrapper>
        <SiteFooter />
      </SiteFooterWrapper>
      <SiteWhatsAppButton phone={whatsappNumber} />
      <SiteMobileNav />
    </>
  );
}
