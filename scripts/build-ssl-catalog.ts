/**
 * Crawls Solid State Logic store plug-ins and generates lib/catalog/ssl-products.ts + images.
 *
 * Run: npm run build:ssl-catalog
 */

import {
  buildCatalogFile,
  discoverSslStoreProducts,
} from "./lib/official-catalog";

const MANUFACTURER = "Solid State Logic";
const MANUFACTURER_TAG = "solid-state-logic";

async function main() {
  console.log("Discovering SSL plug-ins from official store...");
  const items = await discoverSslStoreProducts();
  console.log(`Found ${items.length} products`);

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "SSL_PRODUCTS",
    generatedBy: "scripts/build-ssl-catalog.ts",
    outputFile: "lib/catalog/ssl-products.ts",
    items,
    delayMs: 0,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
