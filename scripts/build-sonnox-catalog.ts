/**
 * Crawls sonnox.com (BigCommerce) and generates lib/catalog/sonnox-products.ts + images.
 *
 * Run: npm run build:sonnox-catalog
 */

import {
  buildCatalogFile,
  discoverSonnoxFromSitemap,
} from "./lib/official-catalog";

const MANUFACTURER = "Sonnox";
const MANUFACTURER_TAG = "sonnox";

async function main() {
  console.log("Discovering Sonnox products from sitemap...");
  const items = await discoverSonnoxFromSitemap();
  console.log(`Found ${items.length} products`);

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "SONNOX_PRODUCTS",
    generatedBy: "scripts/build-sonnox-catalog.ts",
    outputFile: "lib/catalog/sonnox-products.ts",
    items,
    delayMs: 0,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
