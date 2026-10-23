"use client";

import { usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
};

export function ShopLayoutShell({ children, sidebar }: Props) {
  const pathname = usePathname();
  const isProductDetail = /^\/products\/[^/]+\/?$/.test(pathname);

  if (isProductDetail) {
    return <div className="mx-auto w-full max-w-[1320px]">{children}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1320px] px-3 sm:px-4 md:px-6 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[248px_minmax(0,1fr)]">
      {sidebar}
      <div className="min-w-0 w-full">{children}</div>
    </div>
  );
}
