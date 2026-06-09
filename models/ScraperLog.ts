import mongoose, { Schema, Document, Model } from "mongoose";

export interface ScraperLogDocument extends Document {
  retailerSlug: string;
  startedAt: Date;
  finishedAt?: Date;
  status: "pending" | "running" | "success" | "failed" | "partial";
  type?: "scheduled" | "manual";
  errorMessage?: string;
  itemsScraped: number;
  productsAdded?: number;
  productsUpdated?: number;
  failedUrls: string[];
  screenshotUrl?: string;
  rawHtmlPath?: string;
}

const ScraperLogSchema = new Schema<ScraperLogDocument>({
  retailerSlug: { type: String, required: true },
  startedAt: { type: Date, default: Date.now, index: true },
  finishedAt: { type: Date },
  status: {
    type: String,
    enum: ["pending", "running", "success", "failed", "partial"],
    default: "running",
  },
  type: {
    type: String,
    enum: ["scheduled", "manual"],
  },
  errorMessage: { type: String },
  itemsScraped: { type: Number, default: 0 },
  productsAdded: { type: Number },
  productsUpdated: { type: Number },
  failedUrls: [{ type: String }],
  screenshotUrl: { type: String },
  rawHtmlPath: { type: String },
});

ScraperLogSchema.index({ retailerSlug: 1, startedAt: -1 }, { background: true });
ScraperLogSchema.index({ status: 1, finishedAt: -1 }, { background: true });
ScraperLogSchema.index({ retailerSlug: 1, status: 1 }, { background: true });
ScraperLogSchema.index({ status: 1, type: 1, startedAt: -1 }, { background: true });

const ScraperLog: Model<ScraperLogDocument> =
  mongoose.models.ScraperLog ??
  mongoose.model<ScraperLogDocument>("ScraperLog", ScraperLogSchema);

export default ScraperLog;
