import { connectDB } from "@/lib/db";
import Favorite from "@/models/Favorite";
import { getProductsByIds } from "@/services/products";
import type { ProductWithPrices } from "@/types";
import mongoose from "mongoose";

function toObjectId(productId: string) {
  return new mongoose.Types.ObjectId(productId);
}

export async function addFavorite(userId: string, productId: string) {
  await connectDB();
  const objectId = toObjectId(productId);
  const existing = await Favorite.findOne({ userId, productId: objectId });
  if (existing) return existing;

  return Favorite.create({
    userId,
    productId: objectId,
  });
}

export async function removeFavorite(userId: string, productId: string) {
  await connectDB();
  return Favorite.findOneAndDelete({ userId, productId: toObjectId(productId) });
}

export async function isProductFavorited(userId: string, productId: string) {
  await connectDB();
  const favorite = await Favorite.findOne({
    userId,
    productId: toObjectId(productId),
  }).lean();
  return !!favorite;
}

export async function getUserFavoriteProducts(
  userId: string,
): Promise<ProductWithPrices[]> {
  await connectDB();
  const favorites = await Favorite.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  if (favorites.length === 0) return [];

  const productIds = favorites.map((favorite) => favorite.productId.toString());
  const products = await getProductsByIds(productIds);
  const productMap = new Map(products.map((product) => [product._id, product]));

  return productIds
    .map((productId) => productMap.get(productId))
    .filter((product): product is ProductWithPrices => product != null);
}
