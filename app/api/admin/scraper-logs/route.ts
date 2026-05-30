import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ScraperLog from "@/models/ScraperLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await connectDB();
    const logs = await ScraperLog.find({}).sort({ startedAt: -1 }).limit(100).lean();
    return NextResponse.json(logs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { retailerSlug } = await req.json();
  // Placeholder: In Phase 2, this triggers an Inngest event
  console.log(`Manual scrape triggered for: ${retailerSlug ?? "all"}`);
  return NextResponse.json({ message: "Scrape job queued (Phase 2 feature)", retailerSlug });
}
