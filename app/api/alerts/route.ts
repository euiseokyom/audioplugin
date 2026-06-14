import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { createAlert, getUserAlertForProduct, getUserAlerts } from "@/services/alerts";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("Unauthorized", 401);
  }

  const productId = req.nextUrl.searchParams.get("productId");

  try {
    if (productId) {
      const alert = await getUserAlertForProduct(session.user.id, productId);
      if (!alert) {
        return NextResponse.json({ alert: null });
      }

      return NextResponse.json({
        alert: {
          _id: (alert._id as { toString(): string }).toString(),
          targetPrice: alert.targetPrice,
          isTriggered: alert.isTriggered,
        },
      });
    }

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
    const body = await req.json();
    const productId = body.productId as string | undefined;
    const targetPrice = Number(body.targetPrice);
    if (!productId || !Number.isFinite(targetPrice) || targetPrice <= 0) {
      return apiError("productId and targetPrice required", 400);
    }
    const alert = await createAlert({
      userId: session.user.id,
      productId,
      targetPrice,
    });
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    return handleRouteError(err, "POST /api/alerts", "Failed to create alert");
  }
}
