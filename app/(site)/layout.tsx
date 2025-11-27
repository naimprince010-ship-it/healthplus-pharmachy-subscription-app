import { MedEasyHeader } from "@/components/MedEasyHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteWhatsAppButton } from "@/components/SiteWhatsAppButton";
import { SiteMobileNav } from "@/components/SiteMobileNav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MedEasyHeader />
      <main className="min-h-screen">{children}</main>
      <SiteFooter />
      <SiteWhatsAppButton />
      <SiteMobileNav />
    </>
  );
}
