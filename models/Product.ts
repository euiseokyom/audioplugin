import mongoose, { Schema, Document, Model } from "mongoose";

export interface ProductDocument extends Document {
  name: string;
  slug: string;
  image: string;
  description: string;
  category: string;
  manufacturer: string;
  registeredPrice: number;
  salesCount: number;
  tags: string[];
  canonicalId: string;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    manufacturer: { type: String, required: true, index: true },
    registeredPrice: { type: Number, required: true },
    salesCount: { type: Number, default: 0, index: true },
    tags: [{ type: String }],
    canonicalId: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

const Product: Model<ProductDocument> =
  mongoose.models.Product ?? mongoose.model<ProductDocument>("Product", ProductSchema);

export default Product;
