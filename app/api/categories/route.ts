import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error";
import { getCategories } from "@/services/categories";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (err) {
    return handleRouteError(err, "GET /api/categories", "Failed to fetch categories");
  }
}
