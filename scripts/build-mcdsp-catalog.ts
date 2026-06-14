/**
 * Crawls McDSP plugin-index and generates lib/catalog/mcdsp-products.ts + images.
 *
 * Run: npm run build:mcdsp-catalog
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  categoryToTag,
  mapMcdspCategory,
} from "../lib/catalog/mcdsp-category-map";
import { DEFAULT_RETAILERS } from "../lib/catalog/manufacturer-retailers";
import { productImageUrl } from "../lib/catalog/product-image-path";
import { filterExcludedSeedProducts } from "../lib/catalog/excluded-catalog-slugs";
import type { SeedProduct } from "../lib/catalog/seed-product";
import {
  fetchAllAudioDeluxeMcDSPProducts,
  matchAudioDeluxeMcDSPProduct,
} from "./lib/audiodeluxe";
import { registeredPriceFromVariants } from "./lib/shopify-catalog";
import {
  fetchPageHtml,
  normalizeMcdspProductName,
  parsePriceFromHtml,
  parseTitleFromHtml,
  resolveMcdspProductImage,
} from "./lib/page-scrape";
import { processProductImageFromUrls } from "./lib/process-product-image";
import {
  resolveShopifyGuiImage,
  serializeCatalogProducts,
} from "./lib/shopify-catalog";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUTPUT_FILE = path.join(ROOT, "lib/catalog/mcdsp-products.ts");
const INDEX_URL = "https://mcdsp.com/plugin-index/";

const MANUFACTURER = "McDSP";
const MANUFACTURER_TAG = "mcdsp";

const SKIP_PATH_SEGMENTS = new Set([
  "plugin-index",
  "plugin-downloads",
  "downloads",
]);

function slugFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? pathname;
  return segment.toLowerCase();
}

function isBundlePath(pathname: string): boolean {
  return /pack|bundle/i.test(pathname);
}

async function discoverProductPaths(): Promise<string[]> {
  const html = await fetchPageHtml(INDEX_URL);
  if (!html) throw new Error("Could not load McDSP plugin index");

  const matches = [
    ...html.matchAll(/href="(https:\/\/mcdsp\.com\/plugin-index\/[^"#]+\/?)"/gi),
  ];

  const paths = new Set<string>();
  for (const match of matches) {
    const url = new URL(match[1]);
    const segment = url.pathname.split("/").filter(Boolean).pop() ?? "";
    if (!segment || SKIP_PATH_SEGMENTS.has(segment)) continue;
    paths.add(url.pathname.replace(/\/$/, ""));
  }

  return [...paths].sort();
}

async function main() {
  console.log("Loading McDSP products from AudioDeluxe...");
  const audioDeluxeProducts = await fetchAllAudioDeluxeMcDSPProducts();
  console.log(`Found ${audioDeluxeProducts.length} AudioDeluxe McDSP products`);

  console.log("Discovering McDSP products from plugin-index...");
  const paths = await discoverProductPaths();
  console.log(`Found ${paths.length} product paths`);

  const products: SeedProduct[] = [];
  let imageSuccess = 0;

  for (let i = 0; i < paths.length; i++) {
    const pathname = paths[i];
    const pageUrl = `https://mcdsp.com${pathname}/`;
    const slug = slugFromPath(pathname);
    const html = await fetchPageHtml(pageUrl);
    if (!html) continue;

    const rawTitle = parseTitleFromHtml(html) ?? slug.replace(/-/g, " ");
    const title = normalizeMcdspProductName(rawTitle);
    const adProduct = matchAudioDeluxeMcDSPProduct(audioDeluxeProducts, slug);
    const registeredPrice =
      parsePriceFromHtml(html) ??
      (adProduct ? registeredPriceFromVariants(adProduct.variants) : 0);
    const isBundle = isBundlePath(pathname);
    const category = mapMcdspCategory(pathname, title);

    const tags = new Set<string>([MANUFACTURER_TAG, categoryToTag(category)]);
    if (isBundle) tags.add("bundle");

    const mcdspImageUrl = html
      ? resolveMcdspProductImage(html, pageUrl, slug, { isBundle })
      : null;
    const adImageUrl =
      isBundle && adProduct ? resolveShopifyGuiImage(adProduct) : null;
    const imageUrls = [mcdspImageUrl, adImageUrl].filter((url): url is string =>
      Boolean(url),
    );

    if (imageUrls.length > 0) {
      const ok = await processProductImageFromUrls(slug, imageUrls, {
        manufacturerTag: MANUFACTURER_TAG,
      });
      if (ok) {
        imageSuccess++;
        const source = mcdspImageUrl ? "mcdsp.com" : "AudioDeluxe";
        console.log(`  ✓ ${slug} ← ${source}`);
      }
    } else {
      console.warn(`  ✗ No image for ${slug}`);
    }


    products.push({
      name: title,
      slug,
      canonicalId: `${slug}-${MANUFACTURER_TAG}`,
      image: productImageUrl(MANUFACTURER_TAG, slug),
      category,
      manufacturer: MANUFACTURER,
      registeredPrice,
      tags: [...tags],
      retailers: [...DEFAULT_RETAILERS],
    });

    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${paths.length} processed...`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  const bySlug = new Map<string, SeedProduct>();
  for (const p of products) {
    bySlug.set(p.slug, p);
  }
  const sorted = filterExcludedSeedProducts(
    [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  const output = serializeCatalogProducts(sorted, {
    exportName: "MCDSP_PRODUCTS",
    generatedBy: "scripts/build-mcdsp-catalog.ts",
  });

  await fs.writeFile(OUTPUT_FILE, output, "utf8");
  console.log(`Wrote ${sorted.length} products to ${OUTPUT_FILE}`);
  console.log(`Images: ${imageSuccess}/${sorted.length} succeeded`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
