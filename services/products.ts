import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import { RETAILER_MAP } from "@/lib/retailers";
import type { ProductWithPrices, IPriceEntry, IProduct } from "@/types";
import mongoose from "mongoose";

async function enrichProductsWithPrices(products: unknown[]): Promise<ProductWithPrices[]> {
  if (products.length === 0) return [];

  const productIds = products.map((p) => (p as { _id: mongoose.Types.ObjectId })._id);

  const latestPrices = await PriceEntry.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $sort: { scrapedAt: -1 } },
    {
      $group: {
        _id: { productId: "$productId", retailerSlug: "$retailerSlug" },
        price: { $first: "$price" },
        affiliateUrl: { $first: "$affiliateUrl" },
        currency: { $first: "$currency" },
        scrapedAt: { $first: "$scrapedAt" },
        entryId: { $first: "$_id" },
      },
    },
  ]);

  const pricesByProduct: Record<string, IPriceEntry[]> = {};
  for (const entry of latestPrices) {
    const pid = entry._id.productId.toString();
    if (!pricesByProduct[pid]) pricesByProduct[pid] = [];
    pricesByProduct[pid].push({
      _id: entry.entryId.toString(),
      productId: pid,
      retailerSlug: entry._id.retailerSlug,
      retailer: RETAILER_MAP[entry._id.retailerSlug],
      affiliateUrl: entry.affiliateUrl,
      price: entry.price,
      currency: entry.currency,
      scrapedAt: entry.scrapedAt,
    });
  }

  return products.map((raw) => {
    const p = raw as IProduct & { _id: { toString(): string }; registeredPrice: number };
    const id = p._id.toString();
    const prices = pricesByProduct[id] ?? [];
    const lowestPrice =
      prices.length > 0 ? Math.min(...prices.map((e) => e.price)) : p.registeredPrice;
    const discountPercent = Math.round(
      ((p.registeredPrice - lowestPrice) / p.registeredPrice) * 100
    );
    return {
      ...p,
      _id: id,
      currentPrices: prices,
      lowestPrice,
      discountPercent,
    };
  });
}

async function getHistoricalMinPrices(
  productIds: mongoose.Types.ObjectId[]
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const mins = await PriceEntry.aggregate([
    { $match: { productId: { $in: productIds } } },
    { $group: { _id: "$productId", minPrice: { $min: "$price" } } },
  ]);

  return new Map(
    mins.map((m) => [m._id.toString(), m.minPrice as number])
  );
}

export async function getProducts({
  category,
  manufacturer,
  q,
  sort = "deals",
  page = 1,
  pageSize = 20,
}: {
  category?: string;
  manufacturer?: string;
  q?: string;
  sort?: "deals" | "bestseller" | "newest";
  page?: number;
  pageSize?: number;
} = {}) {
  await connectDB();

  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (manufacturer) filter.manufacturer = manufacturer;
  if (q) filter.$text = { $search: q };

  const sortOption: Record<string, 1 | -1> =
    sort === "bestseller"
      ? { salesCount: -1 }
      : sort === "newest"
        ? { createdAt: -1 }
        : { salesCount: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const withPrices = await enrichProductsWithPrices(products);

  if (sort === "deals") {
    withPrices.sort((a, b) => b.discountPercent - a.discountPercent);
  }

  return {
    data: withPrices,
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getProductBySlug(slug: string): Promise<ProductWithPrices | null> {
  await connectDB();

  const product = await Product.findOne({ slug }).lean();
  if (!product) return null;

  const id = (product._id as { toString(): string }).toString();

  const latestPrices = await PriceEntry.aggregate([
    { $match: { productId: product._id } },
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
  ]);

  const currentPrices: IPriceEntry[] = latestPrices.map((e) => ({
    _id: e.entryId.toString(),
    productId: id,
    retailerSlug: e._id,
    retailer: RETAILER_MAP[e._id],
    affiliateUrl: e.affiliateUrl,
    price: e.price,
    currency: e.currency,
    scrapedAt: e.scrapedAt,
  }));

  currentPrices.sort((a, b) => a.price - b.price);
  if (currentPrices.length > 0) currentPrices[0].isLowest = true;

  const lowestPrice = currentPrices.length > 0 ? currentPrices[0].price : product.registeredPrice;
  const discountPercent = Math.round(
    ((product.registeredPrice - lowestPrice) / product.registeredPrice) * 100
  );

  return {
    ...(product as unknown as IProduct),
    _id: id,
    currentPrices,
    lowestPrice,
    discountPercent,
  };
}

export async function searchProducts(q: string, limit = 10) {
  await connectDB();
  return Product.find(
    { $or: [{ name: { $regex: q, $options: "i" } }, { manufacturer: { $regex: q, $options: "i" } }] },
    { name: 1, slug: 1, image: 1, manufacturer: 1 }
  )
    .limit(limit)
    .lean();
}

export async function getHotDeals(limit = 8) {
  await connectDB();

  const products = await Product.find({}).lean();
  const withPrices = await enrichProductsWithPrices(products);
  const minPrices = await getHistoricalMinPrices(products.map((p) => p._id));

  const hot = withPrices
    .map((p) => {
      const historicalMin = minPrices.get(p._id);
      const isAllTimeLow =
        historicalMin !== undefined && p.lowestPrice <= historicalMin + 0.01;
      return { ...p, isAllTimeLow };
    })
    .filter((p) => p.discountPercent > 50 || p.isAllTimeLow)
    .sort((a, b) => b.discountPercent - a.discountPercent);

  return {
    data: hot.slice(0, limit),
    total: hot.length,
    page: 1,
    pageSize: limit,
    hasMore: false,
  };
}

export async function getEndsSoonDeals(limit = 8) {
  await connectDB();

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const products = await Product.find({
    dealEndsAt: { $gte: now, $lte: in48h },
  })
    .sort({ dealEndsAt: 1 })
    .lean();

  const withPrices = await enrichProductsWithPrices(products);
  const minPrices = await getHistoricalMinPrices(products.map((p) => p._id));

  const mapped = withPrices.map((p) => {
    const historicalMin = minPrices.get(p._id);
    const isAllTimeLow =
      historicalMin !== undefined && p.lowestPrice <= historicalMin + 0.01;
    return { ...p, isAllTimeLow };
  });

  mapped.sort((a, b) => {
    if (!a.dealEndsAt || !b.dealEndsAt) return 0;
    return new Date(a.dealEndsAt).getTime() - new Date(b.dealEndsAt).getTime();
  });

  return {
    data: mapped.slice(0, limit),
    total: mapped.length,
    page: 1,
    pageSize: limit,
    hasMore: false,
  };
}
