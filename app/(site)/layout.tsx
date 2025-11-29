import { MedEasyHeader } from "@/components/MedEasyHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteWhatsAppButton } from "@/components/SiteWhatsAppButton";
import { SiteMobileNav } from "@/components/SiteMobileNav";
import TrackingProvider from "@/components/tracking/TrackingProvider";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TrackingProvider />
      <MedEasyHeader />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
      <SiteWhatsAppButton />
      <SiteMobileNav />
    </>
  );
}
