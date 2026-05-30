import mongoose, { Schema, Document, Model } from "mongoose";

export interface PriceEntryDocument extends Document {
  productId: mongoose.Types.ObjectId;
  retailerSlug: string;
  affiliateUrl: string;
  price: number;
  currency: string;
  scrapedAt: Date;
}

const PriceEntrySchema = new Schema<PriceEntryDocument>({
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  retailerSlug: { type: String, required: true },
  affiliateUrl: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  scrapedAt: { type: Date, default: Date.now },
});

PriceEntrySchema.index({ productId: 1, retailerSlug: 1, scrapedAt: -1 });
PriceEntrySchema.index({ scrapedAt: -1 });

const PriceEntry: Model<PriceEntryDocument> =
  mongoose.models.PriceEntry ??
  mongoose.model<PriceEntryDocument>("PriceEntry", PriceEntrySchema);

export default PriceEntry;
