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
import EmptyState from "@/components/EmptyState";
import DealGridSkeleton, { DEAL_GRID_CLASS } from "@/components/DealGridSkeleton";
import { PAGE_CONTAINER } from "@/lib/layout";
import { parseBrowseSort, parseProductFilters } from "@/lib/search-filters";
import { absoluteUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import type { ProductWithPrices } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Search Plugins",
  description:
    "Search and filter audio plugin deals by price, category, and manufacturer. Sort by lowest price, newest, or ending soon.",
  alternates: { canonical: absoluteUrl("/search") },
};

const FILTER_TITLES: Record<ProductFilter, string> = {
  "ends-soon": "Ends Soon",
  "lowest-ever": "Lowest Ever",
  "recently-added": "Recently Added",
};

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
      <EmptyState
        title={
          isHotFilter || productFilters.length > 0
            ? "No plugins match this filter"
            : q
              ? `No results for "${q}"`
              : "No plugins found"
        }
        description={
          isHotFilter || productFilters.length > 0
            ? "Try removing a filter or browse all plugins."
            : "Try a different search term or browse by category."
        }
        actionLabel="Browse all plugins"
        actionHref="/search"
      />
    );
  }

  return (
    <div className={DEAL_GRID_CLASS}>
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
  const validSort = parseBrowseSort(sort);

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
          <Suspense fallback={<DealGridSkeleton count={10} />}>
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
