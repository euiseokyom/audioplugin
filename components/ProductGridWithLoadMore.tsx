"use client";

import { useState } from "react";
import CardProduct from "@/components/CardProduct";
import type { ProductWithPrices } from "@/types";

const PRODUCT_GRID_CLASS =
  "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4";

export type ProductGridFetchParams = {
  category?: string;
  manufacturer?: string;
  sort?: string;
  filters?: string[];
  minPrice?: number;
  maxPrice?: number;
  pageSize?: number;
};

type Props = {
  initialProducts: ProductWithPrices[];
  total: number;
  pageSize: number;
  fetchParams: ProductGridFetchParams;
};

export default function ProductGridWithLoadMore({
  initialProducts,
  total,
  pageSize,
  fetchParams,
}: Props) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const hasMore = products.length < total;

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(pageSize),
      });
      if (fetchParams.category) params.set("category", fetchParams.category);
      if (fetchParams.manufacturer) {
        params.set("manufacturer", fetchParams.manufacturer);
      }
      if (fetchParams.sort) params.set("sort", fetchParams.sort);
      for (const filter of fetchParams.filters ?? []) {
        params.append("filter", filter);
      }
      if (fetchParams.minPrice !== undefined) {
        params.set("minPrice", String(fetchParams.minPrice));
      }
      if (fetchParams.maxPrice !== undefined) {
        params.set("maxPrice", String(fetchParams.maxPrice));
      }
      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) return;

      const data = (await res.json()) as { data?: ProductWithPrices[] };
      if (data.data?.length) {
        setProducts((prev) => [...prev, ...data.data!]);
        setPage(nextPage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className={PRODUCT_GRID_CLASS}>
        {products.map((product) => (
          <CardProduct key={product._id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            className="btn btn-sm btn-ghost gap-2 pl-3 pr-2.5 font-medium border border-base-300 text-sm min-w-40 bg-base-200 font-base-content shadow-none hover:shadow-none hover:[--btn-shadow:0_0_#0000] hover:bg-base-300 hover:[--btn-bg:var(--color-neutral-content)]"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
