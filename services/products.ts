import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import { RETAILER_MAP } from "@/lib/retailers";
import type { ProductWithPrices, IPriceEntry } from "@/types";

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

  const productIds = products.map((p) => p._id);

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

  const withPrices: ProductWithPrices[] = products.map((p) => {
    const id = (p._id as { toString(): string }).toString();
    const prices = pricesByProduct[id] ?? [];
    const lowestPrice = prices.length > 0 ? Math.min(...prices.map((e) => e.price)) : p.registeredPrice;
    const discountPercent = Math.round(((p.registeredPrice - lowestPrice) / p.registeredPrice) * 100);
    return {
      ...(p as unknown as import("@/types").IProduct),
      _id: id,
      currentPrices: prices,
      lowestPrice,
      discountPercent,
    };
  });

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
    ...(product as unknown as import("@/types").IProduct),
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

export async function getHottestDeals(limit = 8) {
  return getProducts({ sort: "deals", pageSize: limit });
}

export async function getBestSellers(limit = 8) {
  return getProducts({ sort: "bestseller", pageSize: limit });
}
