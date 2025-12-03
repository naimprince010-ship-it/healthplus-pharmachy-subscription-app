import { MedEasyHeader } from "@/components/MedEasyHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteFooterWrapper } from "@/components/SiteFooterWrapper";
import { SiteWhatsAppButton } from "@/components/SiteWhatsAppButton";
import { SiteMobileNav } from "@/components/SiteMobileNav";
import TrackingProvider from "@/components/tracking/TrackingProvider";
import { getBasicSettings } from "@/lib/settings-server";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const basicSettings = await getBasicSettings();
  
  return (
    <>
      <TrackingProvider />
      <MedEasyHeader storeName={basicSettings.storeName} />
      <main className="min-h-screen">{children}</main>
      <SiteFooterWrapper>
        <SiteFooter />
      </SiteFooterWrapper>
      <SiteWhatsAppButton />
      <SiteMobileNav />
    </>
  );
}
