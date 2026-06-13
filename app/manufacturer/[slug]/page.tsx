import { notFound } from "next/navigation";
import { getProducts, type ProductSort } from "@/services/products";
import { getManufacturers } from "@/services/manufacturers";
import ProductGridWithLoadMore from "@/components/ProductGridWithLoadMore";
import SearchFiltersBar from "@/components/SearchFiltersBar";
import EmptyState from "@/components/EmptyState";
import { PAGE_CONTAINER } from "@/lib/layout";
import { matchManufacturer, normalizeManufacturerSlug } from "@/lib/manufacturer-slug";
import {
  parseBrowseSort,
  parsePriceRange,
  parseProductFilters,
} from "@/lib/search-filters";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return {
    title: `${name} Plugins — Deals & Prices`,
    description: `Find the best deals on ${name} audio plugins across 16 retailers.`,
  };
}

export default async function ManufacturerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    filter?: string | string[];
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const { slug } = await params;
  const { sort, filter, minPrice, maxPrice } = await searchParams;
  const manufacturerName = normalizeManufacturerSlug(slug);
  const productFilters = parseProductFilters(filter);
  const priceRange = parsePriceRange(minPrice, maxPrice);
  const validSort = parseBrowseSort(sort) as ProductSort;
  const basePath = `/manufacturer/${slug}`;

  const allManufacturers = await getManufacturers();
  const matched = allManufacturers.find((m) =>
    matchManufacturer(m.name, manufacturerName),
  );
  const displayName = matched?.name ?? manufacturerName;

  const result = await getProducts({
    manufacturer: displayName,
    sort: validSort,
    filters: productFilters,
    minPrice: priceRange.min,
    maxPrice: priceRange.max,
    pageSize: 40,
  });

  if (!matched && result.data.length === 0) notFound();

  const gridKey = `${validSort}-${productFilters.join(",")}-${priceRange.min ?? ""}-${priceRange.max ?? ""}`;

  return (
    <div className={`${PAGE_CONTAINER} py-10 space-y-8`}>
      <div>
        <div className="flex items-center gap-2 text-sm text-base-content/50 mb-3">
          <a href="/" className="hover:text-primary transition-colors">
            Home
          </a>
          <span>/</span>
          <span>Manufacturers</span>
          <span>/</span>
          <span className="text-base-content">{displayName}</span>
        </div>
        <h1 className="text-3xl font-bold">{displayName}</h1>
        <p className="text-base-content/50 mt-1">{result.total} plugins</p>
      </div>

      <SearchFiltersBar
        basePath={basePath}
        sort={validSort}
        filters={productFilters}
        priceRange={priceRange}
      />

      {result.data.length === 0 ? (
        <EmptyState
          title="No plugins match this filter"
          description="Try removing a filter or browse all plugins from this manufacturer."
          actionLabel={`Browse all ${displayName}`}
          actionHref={basePath}
        />
      ) : (
        <ProductGridWithLoadMore
          key={gridKey}
          initialProducts={result.data}
          total={result.total}
          pageSize={40}
          fetchParams={{
            manufacturer: displayName,
            sort: validSort,
            filters: productFilters,
            minPrice: priceRange.min,
            maxPrice: priceRange.max,
          }}
        />
      )}
    </div>
  );
}
