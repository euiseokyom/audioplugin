/**
 * Quick verification that Plugin Boutique prices exist in MongoDB.
 * Run: npx tsx --env-file=.env.local scripts/verify-pb-prices.ts
 */
import mongoose from "mongoose";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/audioplugin";

async function main() {
  await mongoose.connect(MONGODB_URI);

  const samples = [
    { manufacturer: "Soundtoys", slug: "decapitator" },
    { manufacturer: "Waves", slug: "cla-76-compressor-limiter" },
    { manufacturer: "Plugin Alliance", slug: "bx_console-amek-9099" },
  ];

  for (const { manufacturer, slug } of samples) {
    const product = await Product.findOne({ slug, manufacturer }).lean();
    if (!product) {
      console.log(`${manufacturer}/${slug}: product not found`);
      continue;
    }

    const latest = await PriceEntry.findOne({
      productId: product._id,
      retailerSlug: "plugin-boutique",
    })
      .sort({ scrapedAt: -1 })
      .lean();

    console.log(
      `${manufacturer}/${slug}: PB price=${latest?.price ?? "none"} url=${latest?.affiliateUrl?.slice(0, 60) ?? "none"}`,
    );
  }

  const pbCount = await PriceEntry.countDocuments({
    retailerSlug: "plugin-boutique",
  });
  console.log(`\nTotal plugin-boutique PriceEntry docs: ${pbCount}`);

  await mongoose.disconnect();
}

main();
