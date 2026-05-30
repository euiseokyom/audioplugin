import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/services/products";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const category = searchParams.get("category") ?? undefined;
  const manufacturer = searchParams.get("manufacturer") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const sort = (searchParams.get("sort") as "deals" | "bestseller" | "newest") ?? "deals";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "20");

  try {
    const result = await getProducts({ category, manufacturer, q, sort, page, pageSize });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
