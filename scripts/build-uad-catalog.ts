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
import { DEFAULT_RETAILERS } from "../lib/catalog/manufacturer-retailers";
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

/** UAD Select bundles are legacy aliases of Custom bundles. */
const SELECT_TO_CUSTOM_SLUG: Record<string, string> = {
  "uad-select-2-bundle": "uad-custom-2-bundle",
  "uad-select-3-plus-3-bundle": "uad-custom-3-plus-3-bundle",
  "uad-select-6-plus-6-bundle": "uad-custom-6-plus-6-bundle",
  "uad-select-10-plus-10-bundle": "uad-custom-10-plus-10-bundle",
};

function remapSelectBundleToCustom(slug: string, title: string) {
  const customSlug = SELECT_TO_CUSTOM_SLUG[slug];
  if (!customSlug) return { slug, title };
  return {
    slug: customSlug,
    title: title.replace(/\bSelect\b/i, "Custom"),
  };
}

/** Free UAD plugins — excluded from the deal catalog. */
const SKIP_FREE_SLUGS = new Set([
  "century-tube-channel-strip",
  "polymax-synth",
  "pure-plate-reverb",
  "teletronix-la-2a-tube-compressor",
  "ua-1176-fet",
  "vibe-analog-machines-essentials",
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
      !SKIP_FREE_SLUGS.has(p.handle) &&
      includeUadProduct(p.product_type),
  );

  const bySlug = new Map<string, SeedProduct>();
  let imageSuccess = 0;

  for (let i = 0; i < filtered.length; i++) {
    const product = filtered[i];
    const item = normalizeShopifyProduct(product, {
      resolveImage: (raw) => resolveUadGuiImageUrls(raw)[0] ?? null,
    });
    const shopifySlug = item.slug;
    const { slug, title } = remapSelectBundleToCustom(item.slug, item.title);
    if (slug !== shopifySlug && bySlug.has(slug)) continue;

    const isBundle = isBundleProduct(item.productType, item.tags);
    const category = mapUadCategory(
      item.productType,
      item.tags,
      title,
      isBundle,
      slug,
    );

    const tags = new Set<string>([MANUFACTURER_TAG, "uad", categoryToTag(category)]);
    if (isBundle) tags.add("bundle");

    const seedProduct: SeedProduct = {
      name: title,
      slug,
      canonicalId: `${slug}-${MANUFACTURER_TAG}`,
      image: productImageUrl(MANUFACTURER_TAG, slug),
      category,
      manufacturer: MANUFACTURER,
      registeredPrice: item.registeredPrice,
      tags: [...tags],
      retailers: [...DEFAULT_RETAILERS],
    };

    const imageUrls = await resolveUadProductImageUrls(
      shopifySlug,
      resolveUadGuiImageUrls(product),
    );

    if (imageUrls.length > 0) {
      const ok = await processProductImageFromUrls(slug, imageUrls, {
        manufacturerTag: MANUFACTURER_TAG,
        processingProfile: "light",
      });
      if (ok) imageSuccess++;
    } else {
      console.warn(`  ✗ No image for ${slug}`);
    }

    bySlug.set(slug, seedProduct);
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
