/**
 * Download Slate Digital product GUI images from PluginFox.
 *
 * Run: npm run fetch:slate-pluginfox-images
 * Run one: npm run fetch:slate-pluginfox-images -- fg-2a-compressor-plugin
 */

import { SLATE_PRODUCTS } from "../lib/catalog/slate-products";
import {
  SLATE_PLUGINFOX_HANDLES,
  listUnmappedSlateCatalogSlugs,
  resolveSlatePluginFoxImageUrl,
} from "./lib/slate-pluginfox";
import { processProductImageFromUrls } from "./lib/process-product-image";

const MANUFACTURER_TAG = "slate-digital";
const SKIP_SLUGS = new Set(["audified-u73b"]);

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const catalogSlugs = SLATE_PRODUCTS.map((p) => p.slug).filter(
    (slug) => !SKIP_SLUGS.has(slug),
  );
  const slugs = args.length > 0 ? args : catalogSlugs;

  let ok = 0;
  let skipped = 0;
  let failed = 0;
  const notOnPluginFox: string[] = [];

  for (const slug of slugs) {
    if (SKIP_SLUGS.has(slug)) continue;

    if (!SLATE_PLUGINFOX_HANDLES[slug]) {
      const product = SLATE_PRODUCTS.find((p) => p.slug === slug);
      notOnPluginFox.push(product ? `${slug} (${product.name})` : slug);
      skipped++;
      continue;
    }

    const imageUrl = await resolveSlatePluginFoxImageUrl(slug);
    if (!imageUrl) {
      const product = SLATE_PRODUCTS.find((p) => p.slug === slug);
      notOnPluginFox.push(product ? `${slug} (${product.name})` : slug);
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

  const unmapped = listUnmappedSlateCatalogSlugs(catalogSlugs);
  if (unmapped.length > 0) {
    console.log("\nNot on PluginFox (skipped):");
    for (const slug of unmapped) {
      const product = SLATE_PRODUCTS.find((p) => p.slug === slug);
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
