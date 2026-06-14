import { connectDB } from "@/lib/db";
import Alert from "@/models/Alert";
import { getProductsByIds } from "@/services/products";
import mongoose from "mongoose";

function toObjectId(productId: string) {
  return new mongoose.Types.ObjectId(productId);
}

export async function createAlert({
  userId,
  productId,
  targetPrice,
}: {
  userId: string;
  productId: string;
  targetPrice: number;
}) {
  await connectDB();
  const objectId = toObjectId(productId);
  const existing = await Alert.findOne({ userId, productId: objectId });
  if (existing) {
    existing.targetPrice = targetPrice;
    existing.isTriggered = false;
    return existing.save();
  }
  return Alert.create({ userId, productId: objectId, targetPrice });
}

export async function deleteAlert(alertId: string, userId: string) {
  await connectDB();
  return Alert.findOneAndDelete({ _id: alertId, userId });
}

export async function updateAlert(
  alertId: string,
  userId: string,
  targetPrice: number,
) {
  await connectDB();
  return Alert.findOneAndUpdate(
    { _id: alertId, userId },
    { targetPrice, isTriggered: false },
    { new: true },
  );
}

export async function getUserAlertForProduct(userId: string, productId: string) {
  await connectDB();
  return Alert.findOne({ userId, productId: toObjectId(productId) }).lean();
}

export async function getUserAlerts(userId: string) {
  await connectDB();
  return Alert.find({ userId }).sort({ createdAt: -1 }).lean();
}

export async function getUserAlertsWithProducts(userId: string) {
  const rawAlerts = await getUserAlerts(userId);

  const alertRows = rawAlerts
    .map((alert) => ({
      _id: (alert._id as { toString(): string }).toString(),
      userId: alert.userId,
      productId: (alert.productId as { toString(): string }).toString(),
      targetPrice: alert.targetPrice,
      isTriggered: alert.isTriggered,
      triggeredAt: alert.triggeredAt?.toISOString(),
      createdAt: alert.createdAt.toISOString(),
    }))
    .filter((alert) => mongoose.Types.ObjectId.isValid(alert.productId));

  const products = await getProductsByIds(alertRows.map((alert) => alert.productId));
  const productMap = new Map(products.map((product) => [product._id, product]));

  return alertRows
    .map((alert) => {
      const product = productMap.get(alert.productId);
      if (!product) return null;
      return { ...alert, product };
    })
    .filter((alert): alert is NonNullable<typeof alert> => alert != null);
}
