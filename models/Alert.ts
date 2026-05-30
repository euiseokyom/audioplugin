import mongoose, { Schema, Document, Model } from "mongoose";

export interface AlertDocument extends Document {
  userId: string;
  productId: mongoose.Types.ObjectId;
  targetPrice: number;
  isTriggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<AlertDocument>(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    targetPrice: { type: Number, required: true },
    isTriggered: { type: Boolean, default: false },
    triggeredAt: { type: Date },
  },
  { timestamps: true }
);

AlertSchema.index({ userId: 1, productId: 1 });

const Alert: Model<AlertDocument> =
  mongoose.models.Alert ?? mongoose.model<AlertDocument>("Alert", AlertSchema);

export default Alert;
