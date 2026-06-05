/**
 * Update MongoDB product.image paths to manufacturer subfolders.
 *
 * Run: npm run sync:product-images
 */

import mongoose from "mongoose";
import { resolveProductImageSrc } from "../lib/catalog/product-image-path";
import Product from "../models/Product";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/audioplugin";

async function main(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const products = await Product.find({})
    .select("slug image canonicalId manufacturer")
    .lean();

  let updated = 0;
  let unchanged = 0;

  for (const product of products) {
    const resolved = resolveProductImageSrc({
      image: product.image,
      slug: product.slug,
      canonicalId: product.canonicalId,
      manufacturer: product.manufacturer,
    });

    if (resolved === product.image) {
      unchanged++;
      continue;
    }

    await Product.updateOne(
      { _id: product._id },
      { $set: { image: resolved } },
    );
    updated++;
  }

  console.log(`Done: ${updated} updated, ${unchanged} already correct`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
