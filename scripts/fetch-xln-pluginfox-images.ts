/**
 * Download XLN Audio product GUI images from PluginFox.
 *
 * Run: npm run fetch:xln-pluginfox-images
 * Run one: npm run fetch:xln-pluginfox-images -- rc-20-retro-color
 */

import { XLN_PRODUCTS } from "../lib/catalog/xln-products";
import {
  XLN_PLUGINFOX_HANDLES,
  listUnmappedXlnCatalogSlugs,
  resolveXlnPluginFoxImageUrl,
} from "./lib/xln-pluginfox";
import { processProductImageFromUrls } from "./lib/process-product-image";

const MANUFACTURER_TAG = "xln-audio";

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const catalogSlugs = XLN_PRODUCTS.map((p) => p.slug);
  const slugs = args.length > 0 ? args : catalogSlugs;

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of slugs) {
    if (!XLN_PLUGINFOX_HANDLES[slug]) {
      const product = XLN_PRODUCTS.find((p) => p.slug === slug);
      console.warn(`  - No PluginFox handle for ${product ? `${product.name} (${slug})` : slug}`);
      skipped++;
      continue;
    }

    const imageUrl = await resolveXlnPluginFoxImageUrl(slug);
    if (!imageUrl) {
      const product = XLN_PRODUCTS.find((p) => p.slug === slug);
      console.warn(`  - No image on PluginFox for ${product ? `${product.name} (${slug})` : slug}`);
      skipped++;
      continue;
    }

    const success = await processProductImageFromUrls(slug, [imageUrl], {
      manufacturerTag: MANUFACTURER_TAG,
    });

    if (success) {
      console.log(`  ✓ ${slug} ← ${imageUrl}`);
      ok++;
    } else {
      console.warn(`  ✗ Image processing failed for ${slug}`);
      failed++;
    }
  }

  const unmapped = listUnmappedXlnCatalogSlugs(catalogSlugs);
  if (unmapped.length > 0) {
    console.log("\nNot on PluginFox (skipped):");
    for (const slug of unmapped) {
      const product = XLN_PRODUCTS.find((p) => p.slug === slug);
      console.log(`  - ${product ? `${product.name} (${slug})` : slug}`);
    }
  }

  console.log(`\nDone: ${ok} updated, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
