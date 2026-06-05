/**
 * Crawls fabfilter.com product pages and generates lib/catalog/fabfilter-products.ts + images.
 *
 * Run: npm run build:fabfilter-catalog
 */

import {
  buildCatalogFile,
  enrichFromProductPage,
  fetchFabFilterShopPrice,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { fetchPageHtml } from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "FabFilter";
const MANUFACTURER_TAG = "fabfilter";
const LISTING_URL = "https://www.fabfilter.com/products";

async function discoverFabFilterProducts(): Promise<CatalogSourceItem[]> {
  const html = await fetchPageHtml(LISTING_URL);
  if (!html) throw new Error("Could not load FabFilter products page");

  const paths = [
    ...new Set(
      [...html.matchAll(/href="(\/products\/[^"]+-plug-in)"/gi)].map(
        (m) => m[1],
      ),
    ),
  ].sort();

  const items: CatalogSourceItem[] = [];

  for (const productPath of paths) {
    const slug = productPath.split("/").pop() ?? "";
    const pageUrl = `https://www.fabfilter.com${productPath}`;
    const enriched = await enrichFromProductPage({
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl,
    });

    const registeredPrice = await fetchFabFilterShopPrice(productPath);

    items.push({
      ...enriched,
      registeredPrice,
      isBundle: isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 150));
  }

  return items;
}

async function main() {
  console.log("Discovering FabFilter products...");
  const items = await discoverFabFilterProducts();
  console.log(`Found ${items.length} products`);

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "FABFILTER_PRODUCTS",
    generatedBy: "scripts/build-fabfilter-catalog.ts",
    outputFile: "lib/catalog/fabfilter-products.ts",
    items,
    delayMs: 0,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
