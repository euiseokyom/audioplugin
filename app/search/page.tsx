import { Suspense } from "react";
import { getProducts } from "@/services/products";
import CardProduct from "@/components/CardProduct";

export const revalidate = 60;

async function SearchResults({
  q,
  sort,
}: {
  q: string;
  sort: "deals" | "bestseller" | "newest";
}) {
  const result = await getProducts({ q, sort, pageSize: 40 });

  if (result.data.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-base-content/60">No plugins found for &ldquo;{q}&rdquo;</p>
        <p className="text-sm text-base-content/40 mt-2">
          Try a different search term or browse by category.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/50">
        {result.total} result{result.total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
      </p>
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
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q = "", sort = "deals" } = await searchParams;
  const validSort = (["deals", "bestseller", "newest"] as const).includes(
    sort as "deals" | "bestseller" | "newest"
  )
    ? (sort as "deals" | "bestseller" | "newest")
    : "deals";

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">
          {q ? `Results for "${q}"` : "All Plugins"}
        </h1>

        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/50">Sort by:</span>
          <div className="flex gap-1">
            {(["deals", "bestseller", "newest"] as const).map((s) => (
              <a
                key={s}
                href={`/search?q=${encodeURIComponent(q)}&sort=${s}`}
                className={`btn btn-xs ${validSort === s ? "btn-primary" : "btn-ghost"}`}
              >
                {s === "deals" ? "Best Deals" : s === "bestseller" ? "Best Sellers" : "Newest"}
              </a>
            ))}
          </div>
        </div>
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
        <SearchResults q={q} sort={validSort} />
      </Suspense>
    </div>
  );
}
