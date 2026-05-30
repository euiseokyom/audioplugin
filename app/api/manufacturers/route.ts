import { NextResponse } from "next/server";
import { getManufacturers } from "@/services/manufacturers";

export async function GET() {
  try {
    const manufacturers = await getManufacturers();
    return NextResponse.json(manufacturers);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch manufacturers" }, { status: 500 });
  }
}
