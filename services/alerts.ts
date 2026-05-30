import { connectDB } from "@/lib/db";
import Alert from "@/models/Alert";
import mongoose from "mongoose";

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
  const existing = await Alert.findOne({ userId, productId });
  if (existing) {
    existing.targetPrice = targetPrice;
    existing.isTriggered = false;
    return existing.save();
  }
  return Alert.create({ userId, productId: new mongoose.Types.ObjectId(productId), targetPrice });
}

export async function deleteAlert(alertId: string, userId: string) {
  await connectDB();
  return Alert.findOneAndDelete({ _id: alertId, userId });
}

export async function getUserAlerts(userId: string) {
  await connectDB();
  return Alert.find({ userId }).populate("productId").lean();
}
