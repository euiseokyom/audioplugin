import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { deleteAlert } from "@/services/alerts";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  const { id } = await params;
  try {
    const deleted = await deleteAlert(id, session.user.id);
    if (!deleted) return apiError("Not found", 404);
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err, "DELETE /api/alerts/[id]", "Failed to delete alert");
  }
}
