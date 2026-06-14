import mongoose, { Schema, Document, Model } from "mongoose";

export interface FavoriteDocument extends Document {
  userId: string;
  productId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema = new Schema<FavoriteDocument>(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Favorite: Model<FavoriteDocument> =
  mongoose.models.Favorite ??
  mongoose.model<FavoriteDocument>("Favorite", FavoriteSchema);

export default Favorite;
