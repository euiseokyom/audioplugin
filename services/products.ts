import { resolveProductImageSrc } from "@/lib/catalog/product-image-path";
import { formatProductName } from "@/lib/catalog/product-name";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import { ENDS_SOON_SLUGS, getEndsSoonDealEndDate } from "@/lib/ends-soon";
import { RETAILER_MAP } from "@/lib/retailers";
import { buildSearchFilter } from "@/lib/search-query";
import type { ProductWithPrices, IPriceEntry, IProduct } from "@/types";
import mongoose from "mongoose";

const HOT_DEALS_LOWEST_PRICE_COUNT = 5;
const HOME_SECTION_SIZE = 10;

export type ProductSort =
  | "deals"
  | "bestseller"
  | "newest"
  | "price-asc"
  | "price-desc"
  | "ending-soon";

export type ProductFilter = "ends-soon" | "lowest-ever" | "recently-added";

const RECENTLY_ADDED_DAYS = 30;

function withResolvedImage<T extends {
  name: string;
  image: string;
  slug: string;
  canonicalId?: string;
  manufacturer?: string;
}>(product: T): T {
  return {
    ...product,
    name: formatProductName(product.name),
    image: resolveProductImageSrc(product),
  };
}

function sortEnrichedProducts(
  data: ProductWithPrices[],
  sort: ProductSort,
): ProductWithPrices[] {
  const sorted = [...data];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.lowestPrice - b.lowestPrice);
    case "price-desc":
      return sorted.sort((a, b) => b.lowestPrice - a.lowestPrice);
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    case "ending-soon":
      return sorted.sort((a, b) => {
        if (!a.dealEndsAt && !b.dealEndsAt) return 0;
        if (!a.dealEndsAt) return 1;
        if (!b.dealEndsAt) return -1;
        return new Date(a.dealEndsAt).getTime() - new Date(b.dealEndsAt).getTime();
      });
    case "deals":
      return sorted.sort((a, b) => b.discountPercent - a.discountPercent);
    case "bestseller":
      return sorted.sort((a, b) => b.salesCount - a.salesCount);
    default:
      return sorted;
  }
}

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
    return withResolvedImage({
      ...p,
      _id: id,
      currentPrices: prices,
      lowestPrice,
      discountPercent,
    });
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

function applyAllTimeLow(
  withPrices: ProductWithPrices[],
  minPrices: Map<string, number>
): ProductWithPrices[] {
  return withPrices.map((p) => {
    const historicalMin = minPrices.get(p._id);
    const isAllTimeLow =
      historicalMin !== undefined && p.lowestPrice <= historicalMin + 0.01;
    return { ...p, isAllTimeLow };
  });
}

export async function getProducts({
  category,
  manufacturer,
  q,
  sort = "deals",
  filter: productFilter,
  filters: productFilters,
  page = 1,
  pageSize = 20,
}: {
  category?: string;
  manufacturer?: string;
  q?: string;
  sort?: ProductSort;
  filter?: ProductFilter;
  filters?: ProductFilter[];
  page?: number;
  pageSize?: number;
} = {}) {
  await connectDB();

  const activeFilters =
    productFilters ??
    (productFilter !== undefined ? [productFilter] : []);

  const filter: Record<string, unknown> = {};
  if (category) {
    filter.category = {
      $regex: `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    };
  }
  if (manufacturer) filter.manufacturer = manufacturer;
  if (q) {
    Object.assign(filter, buildSearchFilter(q));
  }

  if (activeFilters.includes("ends-soon")) {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    await refreshStaleEndsSoonDeals(now);
    filter.dealEndsAt = { $gte: now, $lte: in48h };
  }

  if (activeFilters.includes("recently-added")) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RECENTLY_ADDED_DAYS);
    filter.createdAt = { $gte: cutoff };
  }

  const needsPostProcess =
    sort === "price-asc" ||
    sort === "price-desc" ||
    sort === "ending-soon" ||
    sort === "deals" ||
    activeFilters.includes("lowest-ever");

  if (needsPostProcess) {
    const products = await Product.find(filter).lean();
    const withPrices = await enrichProductsWithPrices(products);
    const minPrices = await getHistoricalMinPrices(
      products.map((p) => p._id as mongoose.Types.ObjectId),
    );
    let data = applyAllTimeLow(withPrices, minPrices);

    if (activeFilters.includes("lowest-ever")) {
      data = data.filter((p) => p.isAllTimeLow);
    }

    const sorted = sortEnrichedProducts(data, sort);
    const total = sorted.length;
    const offset = (page - 1) * pageSize;

    return {
      data: sorted.slice(offset, offset + pageSize),
      total,
      page,
      pageSize,
      hasMore: offset + pageSize < total,
    };
  }

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
  const minPrices = await getHistoricalMinPrices(
    products.map((p) => p._id as mongoose.Types.ObjectId),
  );
  const data = applyAllTimeLow(withPrices, minPrices);

  return {
    data,
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

  return withResolvedImage({
    ...(product as unknown as IProduct),
    _id: id,
    currentPrices,
    lowestPrice,
    discountPercent,
  });
}

const SITEMAP_PRODUCT_LIMIT = 3000;

export async function getProductSlugsForSitemap(): Promise<
  { slug: string; updatedAt?: Date }[]
> {
  await connectDB();
  return Product.find({}, { slug: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .limit(SITEMAP_PRODUCT_LIMIT)
    .lean();
}

export async function searchProducts(q: string, limit = 10) {
  await connectDB();
  const results = await Product.find(buildSearchFilter(q), {
    name: 1,
    slug: 1,
    image: 1,
    manufacturer: 1,
    canonicalId: 1,
  })
    .limit(limit)
    .lean();

  return results.map((r) =>
    withResolvedImage({
      name: r.name,
      slug: r.slug,
      image: r.image,
      manufacturer: r.manufacturer,
      canonicalId: r.canonicalId,
    }),
  );
}

function isBundleProduct(product: { category: string }) {
  return product.category === "Bundle";
}

function pickHotDeals(
  products: ProductWithPrices[],
  limit: number,
): ProductWithPrices[] {
  const nonBundles = products.filter((p) => !isBundleProduct(p));
  const lowestPricePicks = [...nonBundles]
    .sort((a, b) => a.lowestPrice - b.lowestPrice)
    .slice(0, HOT_DEALS_LOWEST_PRICE_COUNT);
  const pickedIds = new Set(lowestPricePicks.map((p) => p._id));

  const discountPicks = nonBundles
    .filter((p) => !pickedIds.has(p._id))
    .sort((a, b) => b.discountPercent - a.discountPercent)
    .slice(0, limit - lowestPricePicks.length);

  return [...lowestPricePicks, ...discountPicks];
}

export async function getHotDeals(limit = HOME_SECTION_SIZE) {
  await connectDB();

  const products = await Product.find({ category: { $ne: "Bundle" } }).lean();
  const withPrices = await enrichProductsWithPrices(products);
  const minPrices = await getHistoricalMinPrices(products.map((p) => p._id));

  const hot = pickHotDeals(applyAllTimeLow(withPrices, minPrices), limit);

  return {
    data: hot,
    total: hot.length,
    page: 1,
    pageSize: limit,
    hasMore: false,
  };
}

export async function getBundles(limit = HOME_SECTION_SIZE) {
  await connectDB();

  const products = await Product.find({ category: "Bundle" }).lean();
  const withPrices = await enrichProductsWithPrices(products);
  const minPrices = await getHistoricalMinPrices(products.map((p) => p._id));

  const sorted = applyAllTimeLow(withPrices, minPrices).sort(
    (a, b) => b.discountPercent - a.discountPercent,
  );

  return {
    data: sorted.slice(0, limit),
    total: sorted.length,
    page: 1,
    pageSize: limit,
    hasMore: sorted.length > limit,
  };
}

async function refreshStaleEndsSoonDeals(now: Date) {
  const stale = await Product.find({
    slug: { $in: [...ENDS_SOON_SLUGS] },
    $or: [{ dealEndsAt: { $exists: false } }, { dealEndsAt: { $lte: now } }],
  }).lean();

  await Promise.all(
    stale.map((p) => {
      const dealEndsAt = getEndsSoonDealEndDate(p.slug, now);
      if (!dealEndsAt) return Promise.resolve();
      return Product.updateOne({ _id: p._id }, { $set: { dealEndsAt } });
    }),
  );
}

export async function getEndsSoonDeals(limit = HOME_SECTION_SIZE) {
  await connectDB();

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await refreshStaleEndsSoonDeals(now);

  const products = await Product.find({
    category: { $ne: "Bundle" },
    dealEndsAt: { $gte: now, $lte: in48h },
  })
    .sort({ dealEndsAt: 1 })
    .lean();

  const withPrices = await enrichProductsWithPrices(products);
  const minPrices = await getHistoricalMinPrices(products.map((p) => p._id));

  const mapped = applyAllTimeLow(withPrices, minPrices);

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
