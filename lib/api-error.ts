import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(
  err: unknown,
  context: string,
  publicMessage = "Internal server error"
) {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(context, { error: message });
  return apiError(publicMessage, 500);
}
