import { getHottestDeals, getBestSellers } from "@/services/products";
import { getCategories } from "@/services/categories";
import { getManufacturers } from "@/services/manufacturers";
import SectionHottestDeals from "@/components/SectionHottestDeals";
import SectionBestSellers from "@/components/SectionBestSellers";
import SectionCategories from "@/components/SectionCategories";
import SectionManufacturers from "@/components/SectionManufacturers";

export const revalidate = 3600;

export default async function HomePage() {
  const [hotDeals, bestSellers, categories, manufacturers] = await Promise.all([
    getHottestDeals(8),
    getBestSellers(8),
    getCategories(),
    getManufacturers(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-16">
      {/* Hero */}
      <div className="text-center space-y-4 py-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          The best{" "}
          <span className="text-primary">audio plugin deals</span>
          <br className="hidden sm:block" />
          {" "}in one place
        </h1>
        <p className="text-base-content/60 max-w-xl mx-auto text-lg">
          Track prices across 16 retailers. Set drop alerts. Never overpay again.
        </p>
        <div className="flex items-center justify-center gap-6 pt-2 text-sm text-base-content/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Prices updated daily
          </span>
          <span>16 retailers tracked</span>
          <span>20+ plugins listed</span>
        </div>
      </div>

      {/* Section 1: Hottest Deals */}
      <SectionHottestDeals products={hotDeals.data} />

      {/* Section 2: Best Sellers */}
      <SectionBestSellers products={bestSellers.data} />

      {/* Section 3: Categories */}
      <SectionCategories categories={categories} />

      {/* Section 4: Manufacturers */}
      <SectionManufacturers manufacturers={manufacturers} />
    </div>
  );
}
