import mongoose, { Schema, Document, Model } from "mongoose";

export interface ScraperLogDocument extends Document {
  retailerSlug: string;
  startedAt: Date;
  finishedAt?: Date;
  status: "running" | "success" | "failed" | "partial";
  errorMessage?: string;
  itemsScraped: number;
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
    enum: ["running", "success", "failed", "partial"],
    default: "running",
  },
  errorMessage: { type: String },
  itemsScraped: { type: Number, default: 0 },
  failedUrls: [{ type: String }],
  screenshotUrl: { type: String },
  rawHtmlPath: { type: String },
});

const ScraperLog: Model<ScraperLogDocument> =
  mongoose.models.ScraperLog ??
  mongoose.model<ScraperLogDocument>("ScraperLog", ScraperLogSchema);

export default ScraperLog;
