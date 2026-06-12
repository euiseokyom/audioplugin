import type { ProductFilter, ProductSort } from "@/services/products";

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
}: {
  basePath: string;
  q?: string;
  sort: ProductSort;
  filters?: ProductFilter[];
}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  params.set("sort", sort);
  for (const value of filters) {
    params.append("filter", value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function buildSearchUrl({
  q,
  sort,
  filters = [],
}: {
  q: string;
  sort: ProductSort;
  filters?: ProductFilter[];
}) {
  return buildBrowseUrl({ basePath: "/search", q, sort, filters });
}

export function toggleFilter(
  filters: ProductFilter[],
  value: ProductFilter,
): ProductFilter[] {
  return filters.includes(value)
    ? filters.filter((f) => f !== value)
    : [...filters, value];
}

export function getFilterButtonLabel(filters: ProductFilter[]): string {
  if (filters.length === 0) return "All";

  if (filters.length === 1) {
    return FILTER_OPTIONS.find((o) => o.value === filters[0])?.label ?? "All";
  }

  return `${filters.length} selected`;
}
