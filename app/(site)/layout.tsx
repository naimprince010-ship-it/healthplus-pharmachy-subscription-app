import { MedEasyHeader } from "@/components/MedEasyHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteWhatsAppButton } from "@/components/SiteWhatsAppButton";
import { SiteMobileNav } from "@/components/SiteMobileNav";
import TrackingProvider from "@/components/tracking/TrackingProvider";
import { getBasicSettingsServer } from "@/lib/settings/server";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const basicSettings = await getBasicSettingsServer();
  
  return (
    <>
      <TrackingProvider />
      <MedEasyHeader storeName={basicSettings.storeName} />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
      <SiteWhatsAppButton />
      <SiteMobileNav />
    </>
  );
}
