import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import {
  addFavorite,
  getUserFavoriteProducts,
  isProductFavorited,
} from "@/services/favorites";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }

  const productId = req.nextUrl.searchParams.get("productId");

  try {
    if (productId) {
      const favorited = await isProductFavorited(session.user.id, productId);
      return NextResponse.json({ favorited });
    }

    const products = await getUserFavoriteProducts(session.user.id);
    return NextResponse.json(products);
  } catch (err) {
    return handleRouteError(err, "GET /api/favorites", "Failed to fetch favorites");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }

  try {
    const { productId } = await req.json();
    if (!productId) {
      return apiError("productId required", 400);
    }

    const favorite = await addFavorite(session.user.id, productId);
    return NextResponse.json(favorite, { status: 201 });
  } catch (err) {
    return handleRouteError(err, "POST /api/favorites", "Failed to add favorite");
  }
}
