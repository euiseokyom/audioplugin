import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { deleteAlert, updateAlert } from "@/services/alerts";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const targetPrice = Number(body.targetPrice);
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return apiError("targetPrice required", 400);
    }

    const alert = await updateAlert(id, session.user.id, targetPrice);
    if (!alert) return apiError("Not found", 404);
    return NextResponse.json(alert);
  } catch (err) {
    return handleRouteError(err, "PATCH /api/alerts/[id]", "Failed to update alert");
  }
}

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
