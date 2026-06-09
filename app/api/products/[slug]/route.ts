import { NextRequest, NextResponse } from "next/server";
import { apiError, handleRouteError } from "@/lib/api-error";
import { getProductBySlug } from "@/services/products";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return apiError("Not found", 404);
    return NextResponse.json(product);
  } catch (err) {
    return handleRouteError(err, "GET /api/products/[slug]", "Failed to fetch product");
  }
}
