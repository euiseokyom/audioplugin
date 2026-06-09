import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error";
import { searchProducts } from "@/services/products";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  try {
    const results = await searchProducts(q, 8);
    return NextResponse.json(results);
  } catch (err) {
    return handleRouteError(err, "GET /api/search", "Search failed");
  }
}
