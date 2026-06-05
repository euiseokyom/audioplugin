/**
 * Fetches Universal Audio UAD catalog from Shopify and generates
 * lib/catalog/uad-products.ts + product images.
 *
 * Run: npm run build:uad-catalog
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { categoryToTag, mapUadCategory } from "../lib/catalog/uad-category-map";
import { productImageUrl } from "../lib/catalog/product-image-path";
import type { SeedProduct } from "../lib/catalog/seed-product";
import { collectUaudioProductImageUrls, fetchPageHtml } from "./lib/page-scrape";
import { processProductImageFromUrls } from "./lib/process-product-image";
import {
  fetchAllShopifyProducts,
  isBundleProduct,
  normalizeShopifyProduct,
  rankUadImageUrls,
  resolveUadGuiImageUrls,
  serializeCatalogProducts,
  shouldSkipShopifyProduct,
} from "./lib/shopify-catalog";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUTPUT_FILE = path.join(ROOT, "lib/catalog/uad-products.ts");
const COLLECTION_URL =
  "https://www.uaudio.com/collections/uad-plugins/products.json";

const MANUFACTURER = "Universal Audio";
const MANUFACTURER_TAG = "universal-audio";

const INCLUDED_TYPES = new Set([
  "UAD Plug-Ins",
  "Bundles",
  "Pick Any Bundles",
]);

function includeUadProduct(productType: string): boolean {
  return INCLUDED_TYPES.has(productType.trim());
}

async function resolveUadProductImageUrls(
  handle: string,
  shopifyImages: ReturnType<typeof resolveUadGuiImageUrls>,
): Promise<string[]> {
  const pageHtml = await fetchPageHtml(`https://www.uaudio.com/products/${handle}`);
  const pageUrls = pageHtml ? collectUaudioProductImageUrls(pageHtml) : [];
  return rankUadImageUrls([...shopifyImages, ...pageUrls], handle);
}

async function main() {
  console.log("Fetching Universal Audio catalog from Shopify...");
  const raw = await fetchAllShopifyProducts(COLLECTION_URL);
  const filtered = raw.filter(
    (p) =>
      !shouldSkipShopifyProduct(p, { skipSubscriptions: true }) &&
      includeUadProduct(p.product_type),
  );

  const bySlug = new Map<string, SeedProduct>();
  let imageSuccess = 0;

  for (let i = 0; i < filtered.length; i++) {
    const product = filtered[i];
    const item = normalizeShopifyProduct(product, {
      resolveImage: (raw) => resolveUadGuiImageUrls(raw)[0] ?? null,
    });
    const isBundle = isBundleProduct(item.productType, item.tags);
    const category = mapUadCategory(
      item.productType,
      item.tags,
      item.title,
      isBundle,
    );

    const tags = new Set<string>([MANUFACTURER_TAG, "uad", categoryToTag(category)]);
    if (isBundle) tags.add("bundle");

    const seedProduct: SeedProduct = {
      name: item.title,
      slug: item.slug,
      canonicalId: `${item.slug}-${MANUFACTURER_TAG}`,
      image: productImageUrl(MANUFACTURER_TAG, item.slug),
      category,
      manufacturer: MANUFACTURER,
      registeredPrice: item.registeredPrice,
      tags: [...tags],
      retailers: ["plugin-boutique"],
    };

    const imageUrls = await resolveUadProductImageUrls(
      item.slug,
      resolveUadGuiImageUrls(product),
    );

    if (imageUrls.length > 0) {
      const ok = await processProductImageFromUrls(item.slug, imageUrls, {
        manufacturerTag: MANUFACTURER_TAG,
        processingProfile: "light",
      });
      if (ok) imageSuccess++;
    } else {
      console.warn(`  ✗ No image for ${item.slug}`);
    }

    bySlug.set(item.slug, seedProduct);
    if ((i + 1) % 25 === 0) {
      console.log(`  ${i + 1}/${filtered.length} processed...`);
    }

    await new Promise((r) => setTimeout(r, 120));
  }

  const products = [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const output = serializeCatalogProducts(products, {
    exportName: "UAD_PRODUCTS",
    generatedBy: "scripts/build-uad-catalog.ts",
  });

  await fs.writeFile(OUTPUT_FILE, output, "utf8");
  console.log(`Wrote ${products.length} products to ${OUTPUT_FILE}`);
  console.log(`Images: ${imageSuccess}/${products.length} succeeded`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
