import { getHotDeals, getEndsSoonDeals } from "@/services/products";
import { getCategories } from "@/services/categories";
import { getManufacturers } from "@/services/manufacturers";
import SectionHotDeals from "@/components/SectionHotDeals";
import SectionEndsSoon from "@/components/SectionEndsSoon";
import SectionCategories from "@/components/SectionCategories";
import SectionManufacturers from "@/components/SectionManufacturers";
import SectionSignIn from "@/components/SectionSignIn";
import SearchBox from "@/components/SearchBox";
import { PAGE_CONTAINER } from "@/lib/layout";
import type { PaginatedResponse, ProductWithPrices } from "@/types";

export const revalidate = 3600;

function settled<T>(
  result: PromiseSettledResult<T>,
  fallback: T
): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

export default async function HomePage() {
  const [hotDealsResult, endsSoonResult, categoriesResult, manufacturersResult] =
    await Promise.allSettled([
      getHotDeals(8),
      getEndsSoonDeals(8),
      getCategories(),
      getManufacturers(),
    ]);

  const emptyDeals: PaginatedResponse<ProductWithPrices> = {
    data: [],
    total: 0,
    page: 1,
    pageSize: 8,
    hasMore: false,
  };

  const hotDeals = settled(hotDealsResult, emptyDeals);
  const endsSoon = settled(endsSoonResult, emptyDeals);
  const categories = settled(categoriesResult, []);
  const manufacturers = settled(manufacturersResult, []);

  return (
    <>
      <div className={`${PAGE_CONTAINER} py-10 space-y-16`}>
        {/* Hero */}
        <div className="text-center space-y-4 py-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Save Money on Plugins
            <br className="hidden sm:block" />
            Save Time Comparing Prices
          </h1>
          <p className="text-base-content/60 max-w-xl mx-auto text-2xl font-medium">
            Best audio plugin deals in one place.
          </p>
        </div>

        <SearchBox className="mx-auto w-full max-w-xl" inputClassName="input-md" />

        <SectionHotDeals products={hotDeals.data} />

        <SectionEndsSoon products={endsSoon.data} />

        <SectionCategories categories={categories} />

        <SectionManufacturers manufacturers={manufacturers} />
      </div>

      <SectionSignIn />
    </>
  );
}
