import { Suspense } from "react";
import { getProducts, getHotDeals, getEndsSoonDeals } from "@/services/products";
import CardProduct from "@/components/CardProduct";
import type { ProductWithPrices } from "@/types";

export const revalidate = 60;

const FILTER_TITLES: Record<string, string> = {
  hot: "Hot Deals",
  "ends-soon": "Ends Soon",
};

async function getFilteredResults(
  filter: string | undefined,
  q: string,
  sort: "deals" | "bestseller" | "newest"
): Promise<{ data: ProductWithPrices[]; total: number }> {
  if (filter === "hot") {
    const result = await getHotDeals(40);
    return { data: result.data, total: result.total };
  }
  if (filter === "ends-soon") {
    const result = await getEndsSoonDeals(40);
    return { data: result.data, total: result.total };
  }
  const result = await getProducts({ q, sort, pageSize: 40 });
  return { data: result.data, total: result.total };
}

async function SearchResults({
  q,
  sort,
  filter,
}: {
  q: string;
  sort: "deals" | "bestseller" | "newest";
  filter?: string;
}) {
  const result = await getFilteredResults(filter, q, sort);

  if (result.data.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-base-content/60">
          {filter
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
    <div className="space-y-4">
      {!filter && q && (
        <p className="text-sm text-base-content/50">
          {result.total} result{result.total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
        </p>
      )}
      {filter && (
        <p className="text-sm text-base-content/50">
          {result.total} plugin{result.total !== 1 ? "s" : ""}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {result.data.map((product) => (
          <CardProduct key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; filter?: string }>;
}) {
  const { q = "", sort = "deals", filter } = await searchParams;
  const validFilter =
    filter === "hot" || filter === "ends-soon" ? filter : undefined;
  const validSort = (["deals", "bestseller", "newest"] as const).includes(
    sort as "deals" | "bestseller" | "newest"
  )
    ? (sort as "deals" | "bestseller" | "newest")
    : "deals";

  const pageTitle = validFilter
    ? FILTER_TITLES[validFilter]
    : q
      ? `Results for "${q}"`
      : "All Plugins";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>

        {!validFilter && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/50">Sort by:</span>
            <div className="flex gap-1">
              {(["deals", "newest"] as const).map((s) => (
                <a
                  key={s}
                  href={`/search?q=${encodeURIComponent(q)}&sort=${s}`}
                  className={`btn btn-xs ${validSort === s ? "btn-primary" : "btn-ghost"}`}
                >
                  {s === "deals" ? "Best Deals" : "Newest"}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl bg-base-200 aspect-[4/5] animate-pulse" />
            ))}
          </div>
        }
      >
        <SearchResults q={q} sort={validSort} filter={validFilter} />
      </Suspense>
    </div>
  );
}
