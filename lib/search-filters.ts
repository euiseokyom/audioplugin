import type { ProductFilter, ProductSort } from "@/services/products";

export type PriceRange = {
  min?: number;
  max?: number;
};

export const PRICE_RANGE_MAX = 9999;

export const FILTER_OPTIONS: { value: ProductFilter; label: string }[] = [
  { value: "ends-soon", label: "Ends Soon" },
  { value: "lowest-ever", label: "Lowest Ever" },
  { value: "recently-added", label: "Recently Added" },
];

export const VALID_FILTERS: ProductFilter[] = FILTER_OPTIONS.map((o) => o.value);

export function parseProductFilters(
  filter: string | string[] | undefined,
): ProductFilter[] {
  if (!filter) return [];

  const raw = Array.isArray(filter) ? filter : filter.split(",");
  const seen = new Set<ProductFilter>();

  for (const value of raw) {
    const trimmed = value.trim();
    if (VALID_FILTERS.includes(trimmed as ProductFilter)) {
      seen.add(trimmed as ProductFilter);
    }
  }

  return VALID_FILTERS.filter((f) => seen.has(f));
}

export function parsePriceParam(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > PRICE_RANGE_MAX) {
    return undefined;
  }

  return Math.round(parsed * 100) / 100;
}

export function normalizePriceRange(range: PriceRange): PriceRange {
  const { min, max } = range;
  if (min !== undefined && max !== undefined && min > max) {
    return { min: max, max: min };
  }
  return range;
}

export function parsePriceRange(
  minPrice: string | undefined,
  maxPrice: string | undefined,
): PriceRange {
  return normalizePriceRange({
    min: parsePriceParam(minPrice),
    max: parsePriceParam(maxPrice),
  });
}

export function priceRangesEqual(a: PriceRange, b: PriceRange): boolean {
  return a.min === b.min && a.max === b.max;
}

export function hasPriceRange(range: PriceRange): boolean {
  return range.min !== undefined || range.max !== undefined;
}

export function formatPriceRangeLabel(range: PriceRange): string | null {
  const { min, max } = range;
  if (min === undefined && max === undefined) return null;
  if (min !== undefined && max !== undefined) return `$${min} – $${max}`;
  if (min !== undefined) return `$${min} -`;
  return `- $${max}`;
}

export const BROWSE_SORT_OPTIONS: ProductSort[] = [
  "price-asc",
  "price-desc",
  "newest",
  "ending-soon",
];

export function parseBrowseSort(
  sort: string | undefined,
  fallback: ProductSort = "price-asc",
): ProductSort {
  return BROWSE_SORT_OPTIONS.includes(sort as ProductSort)
    ? (sort as ProductSort)
    : fallback;
}

export function buildBrowseUrl({
  basePath,
  q = "",
  sort,
  filters = [],
  priceRange = {},
}: {
  basePath: string;
  q?: string;
  sort: ProductSort;
  filters?: ProductFilter[];
  priceRange?: PriceRange;
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("sort", sort);
  for (const value of filters) {
    params.append("filter", value);
  }
  if (priceRange.min !== undefined) {
    params.set("minPrice", String(priceRange.min));
  }
  if (priceRange.max !== undefined) {
    params.set("maxPrice", String(priceRange.max));
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildSearchUrl({
  q,
  sort,
  filters = [],
  priceRange = {},
}: {
  q: string;
  sort: ProductSort;
  filters?: ProductFilter[];
  priceRange?: PriceRange;
}) {
  return buildBrowseUrl({ basePath: "/search", q, sort, filters, priceRange });
}

export function toggleFilter(
  filters: ProductFilter[],
  value: ProductFilter,
): ProductFilter[] {
  return filters.includes(value)
    ? filters.filter((f) => f !== value)
    : [...filters, value];
}

export function getFilterButtonLabel(
  filters: ProductFilter[],
  priceRange: PriceRange = {},
): string {
  const priceLabel = formatPriceRangeLabel(priceRange);
  const activeCount = filters.length + (priceLabel ? 1 : 0);

  if (activeCount === 0) return "All";

  if (activeCount === 1) {
    if (filters.length === 1) {
      return FILTER_OPTIONS.find((o) => o.value === filters[0])?.label ?? "All";
    }
    return priceLabel ?? "All";
  }

  return `${activeCount} selected`;
}
