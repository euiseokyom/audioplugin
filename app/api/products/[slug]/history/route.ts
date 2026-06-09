import { NextRequest, NextResponse } from "next/server";
import { apiError, handleRouteError } from "@/lib/api-error";
import { getPriceHistory } from "@/services/prices";
import { getProductBySlug } from "@/services/products";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

  try {
    const product = await getProductBySlug(slug);
    if (!product) return apiError("Not found", 404);

    const history = await getPriceHistory(product._id, days);
    return NextResponse.json(history);
  } catch (err) {
    return handleRouteError(err, "GET /api/products/[slug]/history", "Failed to fetch price history");
  }
}
