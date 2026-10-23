import { Suspense } from "react";
import LeftCategorySidebar from "@/components/LeftCategorySidebar";
import LeftCategorySidebarSkeleton from "@/components/LeftCategorySidebarSkeleton";
import CategoryIconNav from "@/components/CategoryIconNav";
import { ShopLayoutShell } from "@/components/ShopLayoutShell";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full bg-white">
      <Suspense fallback={null}>
        <CategoryIconNav />
      </Suspense>
      <ShopLayoutShell
        sidebar={
          /* Left Sidebar streams independently so main column is not blocked by sidebar DB work */
          <aside className="scrollbar-hide relative z-[30] hidden max-h-[calc(100vh-140px)] self-start overflow-y-auto lg:sticky lg:top-[124px] lg:block">
            <div className="w-[220px] py-4 xl:w-[248px]">
              <Suspense fallback={<LeftCategorySidebarSkeleton />}>
                <LeftCategorySidebar />
              </Suspense>
            </div>
          </aside>
        }
      >
        {children}
      </ShopLayoutShell>
    </div>
  );
}
