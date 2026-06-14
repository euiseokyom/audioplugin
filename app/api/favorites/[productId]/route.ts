import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { removeFavorite } from "@/services/favorites";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }

  const { productId } = await params;

  try {
    const deleted = await removeFavorite(session.user.id, productId);
    if (!deleted) return apiError("Not found", 404);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(
      err,
      "DELETE /api/favorites/[productId]",
      "Failed to remove favorite",
    );
  }
}
