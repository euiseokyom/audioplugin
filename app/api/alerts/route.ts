import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAlert, getUserAlerts } from "@/services/alerts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const alerts = await getUserAlerts(session.user.id);
    return NextResponse.json(alerts);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { productId, targetPrice } = await req.json();
    if (!productId || typeof targetPrice !== "number") {
      return NextResponse.json({ error: "productId and targetPrice required" }, { status: 400 });
    }
    const alert = await createAlert({ userId: session.user.id, productId, targetPrice });
    return NextResponse.json(alert, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
