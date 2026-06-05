/**
 * Fetches Eventide plug-ins from store.eventideaudio.com (Shopify).
 *
 * Run: npm run build:eventide-catalog
 */

import { buildFromShopifyProductsJson } from "./lib/shopify-manufacturer-catalog";
import type { ShopifyProductJson } from "./lib/shopify-catalog";

function shouldInclude(product: ShopifyProductJson): boolean {
  const type = product.product_type.toLowerCase();
  if (!/plug-?in/i.test(type) && !/plug-?in/i.test(product.title)) {
    return false;
  }
  if (/crossgrade|upgrade from/i.test(product.title)) return false;
  return true;
}

async function main() {
  await buildFromShopifyProductsJson({
    collectionUrl:
      "https://store.eventideaudio.com/collections/all/products.json",
    manufacturer: "Eventide",
    manufacturerTag: "eventide",
    exportName: "EVENTIDE_PRODUCTS",
    generatedBy: "scripts/build-eventide-catalog.ts",
    outputFile: "lib/catalog/eventide-products.ts",
    marketingBaseUrl: "https://store.eventideaudio.com/products",
    shouldInclude,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
