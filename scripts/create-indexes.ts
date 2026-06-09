import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { logger } from "@/lib/logger";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import ScraperLog from "@/models/ScraperLog";
import Alert from "@/models/Alert";

async function main() {
  await connectDB();
  logger.info("Syncing MongoDB indexes…");

  const results = await Promise.all([
    Product.syncIndexes(),
    PriceEntry.syncIndexes(),
    ScraperLog.syncIndexes(),
    Alert.syncIndexes(),
  ]);

  for (const dropped of results) {
    if (dropped.length > 0) {
      logger.info("Dropped stale indexes", { indexes: dropped });
    }
  }

  logger.info("Index sync complete");
  await mongoose.disconnect();
}

main().catch((err) => {
  logger.error("Index sync failed", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});
