import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return apiError("Forbidden", 403);
  }
  try {
    await connectDB();
    const products = await Product.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(products);
  } catch (err) {
    return handleRouteError(err, "GET /api/admin/products", "Failed to fetch products");
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return apiError("Forbidden", 403);
  }
  try {
    const { id, updates } = await req.json();
    await connectDB();
    const product = await Product.findByIdAndUpdate(id, updates, { new: true });
    return NextResponse.json(product);
  } catch (err) {
    return handleRouteError(err, "PATCH /api/admin/products", "Failed to update product");
  }
}
