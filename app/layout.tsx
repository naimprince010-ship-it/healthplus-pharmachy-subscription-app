import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthPlus Pharmacy - Subscription Services",
  description: "Full-stack custom subscription pharmacy web app for local customers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
