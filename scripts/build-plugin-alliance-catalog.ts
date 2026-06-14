/**
 * Fetches Plugin Alliance catalog from Shopify and generates
 * lib/catalog/plugin-alliance-products.ts + product images.
 *
 * Run: npm run build:plugin-alliance-catalog
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  categoryToTag,
  mapPluginAllianceCategory,
} from "../lib/catalog/plugin-alliance-category-map";
import {
  pluginAllianceRetailers,
  shouldSkipPluginAllianceProduct,
  shouldSkipPluginAllianceVendor,
} from "../lib/catalog/plugin-alliance-thomann-vendors";
import {
  resolvePaProductManufacturer,
  shouldExcludeFromPluginAllianceCatalog,
} from "../lib/catalog/pa-vendor-manufacturers";
import { filterExcludedSeedProducts } from "../lib/catalog/excluded-catalog-slugs";
import { productImageUrl } from "../lib/catalog/product-image-path";
import type { SeedProduct } from "../lib/catalog/seed-product";
import { processProductImageFromUrls } from "./lib/process-product-image";
import {
  fetchAllShopifyProducts,
  isBundleProduct,
  normalizeShopifyProduct,
  resolvePluginAllianceGuiImage,
  serializeCatalogProducts,
  shouldSkipShopifyProduct,
} from "./lib/shopify-catalog";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const OUTPUT_FILE = path.join(ROOT, "lib/catalog/plugin-alliance-products.ts");
const COLLECTION_URL =
  "https://www.plugin-alliance.com/collections/all/products.json";

const MANUFACTURER = "Plugin Alliance";
const MANUFACTURER_TAG = "plugin-alliance";

async function main() {
  console.log("Fetching Plugin Alliance catalog from Shopify...");
  const raw = await fetchAllShopifyProducts(COLLECTION_URL);
  const filtered = raw.filter((p) => !shouldSkipShopifyProduct(p));

  const bySlug = new Map<string, SeedProduct>();
  let imageSuccess = 0;

  for (let i = 0; i < filtered.length; i++) {
    const item = normalizeShopifyProduct(filtered[i], {
      resolveImage: resolvePluginAllianceGuiImage,
    });
    if (shouldSkipPluginAllianceProduct(item.slug)) continue;

    const isBundle = isBundleProduct(item.productType, item.tags);
    const category = mapPluginAllianceCategory(
      item.productType,
      item.tags,
      isBundle,
      item.title,
      item.slug,
    );

    const tags = new Set<string>([MANUFACTURER_TAG, categoryToTag(category)]);
    if (isBundle) tags.add("bundle");
    const vendorTag = item.vendor
      ? item.vendor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      : undefined;

    if (vendorTag) {
      if (shouldSkipPluginAllianceVendor(vendorTag)) continue;
      tags.add(vendorTag);
    }

    const tagList = [...tags];
    if (shouldExcludeFromPluginAllianceCatalog(tagList)) continue;

    const manufacturer = resolvePaProductManufacturer(tagList);

    const product: SeedProduct = {
      name: item.title,
      slug: item.slug,
      canonicalId: `${item.slug}-${MANUFACTURER_TAG}`,
      image: productImageUrl(MANUFACTURER_TAG, item.slug),
      category,
      manufacturer,
      registeredPrice: item.registeredPrice,
      tags: tagList,
      retailers: pluginAllianceRetailers(tagList),
    };

    if (item.imageUrl) {
      const ok = await processProductImageFromUrls(item.slug, [item.imageUrl], {
        manufacturerTag: MANUFACTURER_TAG,
      });
      if (ok) imageSuccess++;
    } else {
      console.warn(`  ✗ No image for ${item.slug}`);
    }

    bySlug.set(item.slug, product);
    if ((i + 1) % 25 === 0) {
      console.log(`  ${i + 1}/${filtered.length} processed...`);
    }
  }

  const products = filterExcludedSeedProducts(
    [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name)),
  );

  const output = serializeCatalogProducts(products, {
    exportName: "PLUGIN_ALLIANCE_PRODUCTS",
    generatedBy: "scripts/build-plugin-alliance-catalog.ts",
  });

  await fs.writeFile(OUTPUT_FILE, output, "utf8");
  console.log(`Wrote ${products.length} products to ${OUTPUT_FILE}`);
  console.log(`Images: ${imageSuccess}/${products.length} succeeded`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
