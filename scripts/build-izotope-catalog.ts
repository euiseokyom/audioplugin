/**
 * Fetches iZotope catalog from Shopify and generates lib/catalog/izotope-products.ts + images.
 *
 * Run: npm run build:izotope-catalog
 */

import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";
import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import {
  fetchAllShopifyProducts,
  isBundleProduct,
  normalizeShopifyProduct,
  registeredPriceFromVariants,
  shouldSkipShopifyProduct,
} from "./lib/shopify-catalog";

const MANUFACTURER = "iZotope";
const MANUFACTURER_TAG = "izotope";
const COLLECTION_URL = "https://www.izotope.com/products.json";

function isEolProduct(tags: string[]): boolean {
  return tags.some((t) => /^EOL$/i.test(t.trim()));
}

async function main() {
  console.log("Fetching iZotope catalog from Shopify...");
  const raw = await fetchAllShopifyProducts(COLLECTION_URL);
  const filtered = raw.filter((p) => !shouldSkipShopifyProduct(p) && !isEolProduct(p.tags ?? []));

  const items: CatalogSourceItem[] = [];

  for (const product of filtered) {
    const item = normalizeShopifyProduct(product);
    const isBundle = isBundleProduct(item.productType, item.tags);
    const registeredPrice = registeredPriceFromVariants(product.variants);

    items.push({
      name: item.title,
      slug: item.slug,
      pageUrl: `https://www.izotope.com/products/${item.slug}`,
      registeredPrice,
      imageUrl: item.imageUrl,
      isBundle: isBundle || isBundleNameOrSlug(item.title, item.slug),
      tags: item.tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      categoryHint: item.productType,
    });
  }

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "IZOTOPE_PRODUCTS",
    generatedBy: "scripts/build-izotope-catalog.ts",
    outputFile: "lib/catalog/izotope-products.ts",
    items,
    delayMs: 50,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
