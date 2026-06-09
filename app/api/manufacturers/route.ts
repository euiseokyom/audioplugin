import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error";
import { getManufacturers } from "@/services/manufacturers";

export async function GET() {
  try {
    const manufacturers = await getManufacturers();
    return NextResponse.json(manufacturers);
  } catch (err) {
    return handleRouteError(err, "GET /api/manufacturers", "Failed to fetch manufacturers");
  }
}
