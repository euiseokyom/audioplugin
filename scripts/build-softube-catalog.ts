/**
 * Crawls softube.com plug-in categories and generates lib/catalog/softube-products.ts + images.
 *
 * Run: npm run build:softube-catalog
 */

import { SOFTUBE_RETAILERS } from "../lib/catalog/manufacturer-retailers";
import {
  buildCatalogFile,
  discoverSoftubeProducts,
} from "./lib/official-catalog";

const MANUFACTURER = "Softube";
const MANUFACTURER_TAG = "softube";

async function main() {
  console.log("Discovering Softube plug-ins...");
  const items = await discoverSoftubeProducts();
  console.log(`Found ${items.length} products`);

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "SOFTUBE_PRODUCTS",
    generatedBy: "scripts/build-softube-catalog.ts",
    outputFile: "lib/catalog/softube-products.ts",
    items,
    retailers: [...SOFTUBE_RETAILERS],
    delayMs: 0,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
