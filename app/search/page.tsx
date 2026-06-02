import { Suspense } from "react";
import {
  getProducts,
  getHotDeals,
  type ProductFilter,
  type ProductSort,
} from "@/services/products";
import CardProduct from "@/components/CardProduct";
import SearchFiltersBar from "@/components/SearchFiltersBar";
import SectionHeader from "@/components/SectionHeader";
import { PAGE_CONTAINER } from "@/lib/layout";
import { parseProductFilters } from "@/lib/search-filters";
import type { ProductWithPrices } from "@/types";

export const revalidate = 60;

const FILTER_TITLES: Record<ProductFilter, string> = {
  "ends-soon": "Ends Soon",
  "lowest-ever": "Lowest Ever",
  "recently-added": "Recently Added",
};

const VALID_SORTS: ProductSort[] = [
  "price-asc",
  "price-desc",
  "newest",
  "ending-soon",
];

const PRODUCT_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4";

async function getFilteredResults(
  isHotFilter: boolean,
  q: string,
  sort: ProductSort,
  productFilters: ProductFilter[],
): Promise<{ data: ProductWithPrices[]; total: number }> {
  if (isHotFilter) {
    const result = await getHotDeals(40);
    return { data: result.data, total: result.total };
  }

  const result = await getProducts({
    q,
    sort,
    filters: productFilters,
    pageSize: 40,
  });
  return { data: result.data, total: result.total };
}

function getPageTitle(
  isHotFilter: boolean,
  productFilters: ProductFilter[],
  q: string,
): string {
  if (isHotFilter) return "Hot Deals";
  if (productFilters.length === 1) return FILTER_TITLES[productFilters[0]];
  if (productFilters.length > 1) return "Filtered Results";
  if (q) return `Results for "${q}"`;
  return "All Plugins";
}

async function SearchResults({
  q,
  sort,
  isHotFilter,
  productFilters,
}: {
  q: string;
  sort: ProductSort;
  isHotFilter: boolean;
  productFilters: ProductFilter[];
}) {
  const result = await getFilteredResults(isHotFilter, q, sort, productFilters);

  if (result.data.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-base-content/60">
          {isHotFilter || productFilters.length > 0
            ? "No plugins match this filter right now."
            : `No plugins found for "${q}"`}
        </p>
        <p className="text-sm text-base-content/40 mt-2">
          Try a different search term or browse by category.
        </p>
      </div>
    );
  }

  return (
    <div className={PRODUCT_GRID_CLASS}>
      {result.data.map((product) => (
        <CardProduct key={product._id} product={product} />
      ))}
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    filter?: string | string[];
  }>;
}) {
  const { q = "", sort = "price-asc", filter } = await searchParams;
  const isHotFilter = filter === "hot";
  const productFilters = isHotFilter ? [] : parseProductFilters(filter);
  const validSort = VALID_SORTS.includes(sort as ProductSort)
    ? (sort as ProductSort)
    : "price-asc";

  const pageTitle = getPageTitle(isHotFilter, productFilters, q);

  return (
    <div className={`${PAGE_CONTAINER} pt-8 pb-10`}>
      <section>
        <SectionHeader
          title={pageTitle}
          plain
          compact
          pullUp={productFilters.includes("ends-soon")}
        />

        {!isHotFilter && (
          <div className="mt-8">
            <SearchFiltersBar q={q} sort={validSort} filters={productFilters} />
          </div>
        )}

        <div className="mt-6">
          <Suspense
            fallback={
              <div className={PRODUCT_GRID_CLASS}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-base-300 aspect-square animate-pulse"
                  />
                ))}
              </div>
            }
          >
            <SearchResults
              q={q}
              sort={validSort}
              isHotFilter={isHotFilter}
              productFilters={productFilters}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
