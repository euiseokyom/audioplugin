import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, handleRouteError } from "@/lib/api-error";
import { connectDB } from "@/lib/db";
import { RETAILER_MAP } from "@/lib/retailers";
import ScraperLog from "@/models/ScraperLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return apiError("Forbidden", 403);
  }
  try {
    await connectDB();
    const logs = await ScraperLog.find({}).sort({ startedAt: -1 }).limit(100).lean();
    return NextResponse.json(logs);
  } catch (err) {
    return handleRouteError(err, "GET /api/admin/scraper-logs", "Failed to fetch logs");
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return apiError("Forbidden", 403);
  }

  try {
    const { retailerSlug } = await req.json();

    if (!retailerSlug || typeof retailerSlug !== "string") {
      return apiError("retailerSlug is required", 400);
    }

    if (!RETAILER_MAP[retailerSlug]) {
      return apiError("Unknown retailer slug", 400);
    }

    await connectDB();

    const log = await ScraperLog.create({
      retailerSlug,
      status: "pending",
      type: "manual",
      startedAt: new Date(),
      itemsScraped: 0,
      failedUrls: [],
    });

    return NextResponse.json(log, { status: 201 });
  } catch (err) {
    return handleRouteError(err, "POST /api/admin/scraper-logs", "Failed to create scrape job");
  }
}
