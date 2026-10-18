import { MedEasyHeader } from "@/components/MedEasyHeader";
import { NavigationPrefetch } from "@/components/NavigationPrefetch";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteFooterWrapper } from "@/components/SiteFooterWrapper";
import { SiteWhatsAppButton } from "@/components/SiteWhatsAppButton";
import { SiteMobileNav } from "@/components/SiteMobileNav";
import TrackingProvider from "@/components/tracking/TrackingProvider";
import { getBasicSettings } from "@/lib/settings-server";
import { prisma } from "@/lib/prisma";

async function getFreeDeliveryThreshold() {
  try {
    const cartSettings = await prisma.cartPageSettings.findFirst({
      select: { freeDeliveryThreshold: true },
    });

    return cartSettings?.freeDeliveryThreshold ?? null;
  } catch (error) {
    console.error("[SiteLayout] Unable to load cart settings:", error);
    return null;
  }
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [basicSettings, freeDeliveryThreshold] = await Promise.all([
    getBasicSettings(),
    getFreeDeliveryThreshold(),
  ]);
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || basicSettings.storePhone).trim();

  return (
    <>
      <TrackingProvider />
      <NavigationPrefetch />
      <MedEasyHeader
        storeName={basicSettings.storeName}
        freeDeliveryThreshold={freeDeliveryThreshold}
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
