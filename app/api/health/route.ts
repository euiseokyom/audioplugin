import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { withTimeout } from "@/lib/with-timeout";
import Product from "@/models/Product";
import ScraperLog from "@/models/ScraperLog";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;
const SCRAPER_TIMEOUT_MS = 2000;

export async function GET() {
  const env = validateEnv({ strict: process.env.NODE_ENV === "production" });
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor(process.uptime());

  let database: { ok: boolean; latencyMs?: number; error?: string } = {
    ok: false,
  };
  let scraper:
    | { lastSuccessAt: string; retailerSlug: string }
    | undefined;

  const dbStart = Date.now();
  try {
    await withTimeout(connectDB(), DB_TIMEOUT_MS, "Database connect");
    await withTimeout(
      Product.estimatedDocumentCount(),
      DB_TIMEOUT_MS,
      "Database ping"
    );
    database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn("Health check database failure", { error: message });
    database = { ok: false, latencyMs: Date.now() - dbStart, error: message };
  }

  if (database.ok) {
    try {
      const lastSuccess = await withTimeout(
        ScraperLog.findOne({ status: "success" })
          .sort({ finishedAt: -1 })
          .select("finishedAt retailerSlug")
          .lean(),
        SCRAPER_TIMEOUT_MS,
        "Scraper summary"
      );
      if (lastSuccess?.finishedAt) {
        scraper = {
          lastSuccessAt: new Date(lastSuccess.finishedAt).toISOString(),
          retailerSlug: lastSuccess.retailerSlug,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("Health check scraper summary skipped", { error: message });
    }
  }

  let status: "ok" | "degraded" | "error" = "ok";
  if (!database.ok || !env.ok) status = "error";
  else if (env.warnings.length > 0) status = "degraded";

  const body = {
    status,
    timestamp,
    uptimeSeconds,
    env: {
      ok: env.ok,
      missing: env.missing,
      warnings: env.warnings,
    },
    database,
    ...(scraper ? { scraper } : {}),
  };

  const httpStatus = status === "error" ? 503 : 200;
  return NextResponse.json(body, { status: httpStatus });
}
