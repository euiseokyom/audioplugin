import { NextRequest, NextResponse } from "next/server";
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
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const history = await getPriceHistory(product._id, days);
    return NextResponse.json(history);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 });
  }
}
