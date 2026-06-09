import ScraperLog, { type ScraperLogDocument } from "@/models/ScraperLog";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import { RETAILERS, RETAILER_MAP } from "@/lib/retailers";
import type {
  AdminDashboardData,
  IScraperLog,
  RetailerDashboardEntry,
  RetailerHealth,
  SystemHealthSummary,
  SystemHealthStatus,
} from "@/types";

/** How recent a successful scrape must be to count as "healthy". */
export const RETAILER_HEALTHY_THRESHOLD_MS = 36 * 60 * 60 * 1000; // 36 hours

type ScraperLogLean = Pick<
  ScraperLogDocument,
  | "retailerSlug"
  | "startedAt"
  | "finishedAt"
  | "status"
  | "type"
  | "errorMessage"
  | "itemsScraped"
  | "productsAdded"
  | "productsUpdated"
  | "failedUrls"
  | "screenshotUrl"
  | "rawHtmlPath"
> & { _id: { toString(): string } };

type SlugCountRow = { _id: string; count: number };

function serializeLog(doc: ScraperLogLean): IScraperLog {
  return {
    _id: doc._id.toString(),
    retailerSlug: doc.retailerSlug,
    startedAt: new Date(doc.startedAt).toISOString(),
    finishedAt: doc.finishedAt
      ? new Date(doc.finishedAt).toISOString()
      : undefined,
    status: doc.status,
    type: doc.type,
    errorMessage: doc.errorMessage,
    itemsScraped: doc.itemsScraped ?? 0,
    productsAdded: doc.productsAdded,
    productsUpdated: doc.productsUpdated,
    failedUrls: doc.failedUrls ?? [],
    screenshotUrl: doc.screenshotUrl,
    rawHtmlPath: doc.rawHtmlPath,
  };
}

function rowsToCountMap(rows: SlugCountRow[]): Record<string, number> {
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

function mergeCountMaps(...maps: Record<string, number>[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const map of maps) {
    for (const [slug, count] of Object.entries(map)) {
      merged[slug] = Math.max(merged[slug] ?? 0, count);
    }
  }
  return merged;
}

async function getProductCountsByRetailer(): Promise<Record<string, number>> {
  const [fromPrices, fromUrls] = await Promise.all([
    PriceEntry.aggregate<SlugCountRow>([
      { $group: { _id: { slug: "$retailerSlug", productId: "$productId" } } },
      { $group: { _id: "$_id.slug", count: { $sum: 1 } } },
    ]),
    Product.aggregate<SlugCountRow>([
      { $match: { retailerUrls: { $exists: true, $ne: {} } } },
      { $project: { entries: { $objectToArray: "$retailerUrls" } } },
      { $unwind: "$entries" },
      { $group: { _id: "$entries.k", count: { $sum: 1 } } },
    ]),
  ]);

  return mergeCountMaps(rowsToCountMap(fromPrices), rowsToCountMap(fromUrls));
}

function isRetailerActive(
  slug: string,
  productCounts: Record<string, number>,
  scraperSlugs: Set<string>,
  successSlugs: Set<string>
): boolean {
  return (
    (productCounts[slug] ?? 0) > 0 ||
    successSlugs.has(slug) ||
    scraperSlugs.has(slug)
  );
}

function getActiveRetailerCount(
  productCounts: Record<string, number>,
  scraperSlugs: Set<string>,
  successSlugs: Set<string>
): number {
  return RETAILERS.filter((retailer) =>
    isRetailerActive(retailer.slug, productCounts, scraperSlugs, successSlugs)
  ).length;
}

function computeHealth(
  lastRun: { status: string } | null,
  lastSuccessAt: Date | null
): RetailerHealth {
  if (!lastRun) return "error";
  if (lastRun.status === "failed") return "error";

  if (
    lastRun.status === "partial" ||
    lastRun.status === "pending" ||
    lastRun.status === "running"
  ) {
    return "warning";
  }

  if (!lastSuccessAt) return "error";

  const age = Date.now() - lastSuccessAt.getTime();
  if (age > RETAILER_HEALTHY_THRESHOLD_MS) return "warning";

  return "healthy";
}

export function deriveSystemHealth(data: AdminDashboardData): SystemHealthSummary {
  const since24h = Date.now() - 24 * 60 * 60 * 1000;

  const recentFailureCount = data.recentRuns.filter((run) => {
    const started = new Date(run.startedAt).getTime();
    return started >= since24h && (run.status === "failed" || run.status === "partial");
  }).length;

  const pendingJobCount = data.retailers.filter((r) => r.hasPendingJob).length;
  const retailerErrorCount = data.retailers.filter((r) => r.health === "error").length;
  const retailerWarningCount = data.retailers.filter((r) => r.health === "warning").length;

  let status: SystemHealthStatus = "healthy";
  if (retailerErrorCount > 0) {
    status = "error";
  } else if (retailerWarningCount > 0 || recentFailureCount > 0 || pendingJobCount > 0) {
    status = "warning";
  }

  return {
    status,
    lastSuccessfulRun: data.stats.lastSuccessfulRun,
    recentFailureCount,
    pendingJobCount,
    retailerErrorCount,
    retailerWarningCount,
  };
}

export async function getDashboardData(): Promise<AdminDashboardData> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    productsAdded24h,
    productsUpdated24h,
    lastSuccessfulRunDoc,
    recentRunDocs,
    productCounts,
    successfulRetailerSlugs,
    anyScraperRetailerSlugs,
    pendingRetailerSlugs,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ createdAt: { $gte: since24h } }),
    Product.countDocuments({
      updatedAt: { $gte: since24h },
      createdAt: { $lt: since24h },
    }),
    ScraperLog.findOne({ status: "success" })
      .sort({ finishedAt: -1 })
      .lean(),
    ScraperLog.find({}).sort({ startedAt: -1 }).limit(15).lean(),
    getProductCountsByRetailer(),
    ScraperLog.distinct("retailerSlug", { status: "success" }),
    ScraperLog.distinct("retailerSlug"),
    ScraperLog.distinct("retailerSlug", { status: "pending" }),
  ]);

  const successSlugs = new Set(successfulRetailerSlugs as string[]);
  const scraperSlugs = new Set(anyScraperRetailerSlugs as string[]);
  const pendingSlugs = new Set(pendingRetailerSlugs as string[]);

  const activeRetailers = getActiveRetailerCount(
    productCounts,
    scraperSlugs,
    successSlugs
  );

  const lastSuccessfulRun = lastSuccessfulRunDoc
    ? serializeLog(lastSuccessfulRunDoc as ScraperLogLean)
    : null;

  const recentRuns = (recentRunDocs as ScraperLogLean[]).map(serializeLog);

  const retailers: RetailerDashboardEntry[] = await Promise.all(
    RETAILERS.map(async (retailer) => {
      try {
        const [lastSuccessDoc, lastRunDoc] = await Promise.all([
          ScraperLog.findOne({ retailerSlug: retailer.slug, status: "success" })
            .sort({ finishedAt: -1 })
            .lean(),
          ScraperLog.findOne({ retailerSlug: retailer.slug })
            .sort({ startedAt: -1 })
            .lean(),
        ]);

        const lastSuccessAt = lastSuccessDoc?.finishedAt
          ? new Date(lastSuccessDoc.finishedAt)
          : null;

        return {
          slug: retailer.slug,
          name: retailer.name,
          health: computeHealth(
            lastRunDoc as { status: string } | null,
            lastSuccessAt
          ),
          lastSuccessAt: lastSuccessAt?.toISOString() ?? null,
          productCount: productCounts[retailer.slug] ?? 0,
          hasPendingJob: pendingSlugs.has(retailer.slug),
          isActive: isRetailerActive(
            retailer.slug,
            productCounts,
            scraperSlugs,
            successSlugs
          ),
        };
      } catch {
        return {
          slug: retailer.slug,
          name: retailer.name,
          health: "error" as RetailerHealth,
          lastSuccessAt: null,
          productCount: productCounts[retailer.slug] ?? 0,
          hasPendingJob: pendingSlugs.has(retailer.slug),
          isActive: isRetailerActive(
            retailer.slug,
            productCounts,
            scraperSlugs,
            successSlugs
          ),
        };
      }
    })
  );

  return {
    stats: {
      totalProducts,
      activeRetailers,
      lastSuccessfulRun,
      productsAdded24h,
      productsUpdated24h,
    },
    recentRuns,
    retailers,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getScraperLogById(id: string): Promise<IScraperLog | null> {
  const doc = await ScraperLog.findById(id).lean();
  if (!doc) return null;
  return serializeLog(doc as ScraperLogLean);
}

export function getRetailerName(slug: string): string {
  return RETAILER_MAP[slug]?.name ?? slug;
}
