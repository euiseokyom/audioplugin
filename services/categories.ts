import { connectDB } from "@/lib/db";
import Product from "@/models/Product";

export async function getCategories(): Promise<{ name: string; count: number }[]> {
  await connectDB();
  const result = await Product.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return result.map((r) => ({ name: r._id, count: r.count }));
}

export async function getProductsByCategory(category: string, limit = 20) {
  await connectDB();
  return Product.find({ category }).limit(limit).lean();
}
