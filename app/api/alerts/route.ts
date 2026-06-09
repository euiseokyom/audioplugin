import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { createAlert, getUserAlerts } from "@/services/alerts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  try {
    const alerts = await getUserAlerts(session.user.id);
    return NextResponse.json(alerts);
  } catch (err) {
    return handleRouteError(err, "GET /api/alerts", "Failed to fetch alerts");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }
  try {
    const { productId, targetPrice } = await req.json();
    if (!productId || typeof targetPrice !== "number") {
      return apiError("productId and targetPrice required", 400);
    }
    const alert = await createAlert({ userId: session.user.id, productId, targetPrice });
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    return handleRouteError(err, "POST /api/alerts", "Failed to create alert");
  }
}
