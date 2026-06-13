import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error";
import {
  parseBrowseSort,
  parsePriceRange,
  parseProductFilters,
} from "@/lib/search-filters";
import { getProducts, type ProductSort } from "@/services/products";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const manufacturer = searchParams.get("manufacturer") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const sort = parseBrowseSort(
    searchParams.get("sort") ?? undefined,
    "price-asc",
  ) as ProductSort;
  const filterParams = searchParams.getAll("filter");
  const filters = parseProductFilters(
    filterParams.length > 0
      ? filterParams
      : (searchParams.get("filter") ?? undefined),
  );
  const { min, max } = parsePriceRange(
    searchParams.get("minPrice") ?? undefined,
    searchParams.get("maxPrice") ?? undefined,
  );
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

  try {
    const result = await getProducts({
      category,
      manufacturer,
      q,
      sort,
      filters,
      minPrice: min,
      maxPrice: max,
      page,
      pageSize,
    });
    return NextResponse.json(result);
  } catch (err) {
    return handleRouteError(err, "GET /api/products", "Failed to fetch products");
  }
}
