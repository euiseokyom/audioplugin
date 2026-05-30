import { connectDB } from "@/lib/db";
import PriceEntry from "@/models/PriceEntry";
import { RETAILER_MAP } from "@/lib/retailers";
import type { PriceHistoryPoint, IPriceEntry } from "@/types";
import mongoose from "mongoose";

export async function getPricesForProduct(productId: string): Promise<IPriceEntry[]> {
  await connectDB();

  const latest = await PriceEntry.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    { $sort: { scrapedAt: -1 } },
    {
      $group: {
        _id: "$retailerSlug",
        price: { $first: "$price" },
        affiliateUrl: { $first: "$affiliateUrl" },
        currency: { $first: "$currency" },
        scrapedAt: { $first: "$scrapedAt" },
        entryId: { $first: "$_id" },
      },
    },
    { $sort: { price: 1 } },
  ]);

  return latest.map((e, i) => ({
    _id: e.entryId.toString(),
    productId,
    retailerSlug: e._id,
    retailer: RETAILER_MAP[e._id],
    affiliateUrl: e.affiliateUrl,
    price: e.price,
    currency: e.currency,
    scrapedAt: e.scrapedAt,
    isLowest: i === 0,
  }));
}

export async function getPriceHistory(
  productId: string,
  days = 30
): Promise<PriceHistoryPoint[]> {
  await connectDB();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const entries = await PriceEntry.find({
    productId: new mongoose.Types.ObjectId(productId),
    scrapedAt: { $gte: since },
  })
    .sort({ scrapedAt: 1 })
    .lean();

  return entries.map((e) => ({
    date: e.scrapedAt.toISOString().split("T")[0],
    price: e.price,
    retailerSlug: e.retailerSlug,
  }));
}

export async function getLowestEverPrice(productId: string): Promise<number | null> {
  await connectDB();

  const result = await PriceEntry.findOne(
    { productId: new mongoose.Types.ObjectId(productId) },
    { price: 1 }
  )
    .sort({ price: 1 })
    .lean();

  return result ? result.price : null;
}
