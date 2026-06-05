/**
 * Crawls relabdevelopment.com product pages and generates lib/catalog/relab-products.ts.
 *
 * Run: npm run build:relab-catalog
 */

import {
  buildCatalogFile,
  enrichFromProductPage,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { fetchPageHtml } from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "Relab Development";
const MANUFACTURER_TAG = "relab-development";
const BASE = "https://relabdevelopment.com";

const PRODUCT_SLUGS = [
  "lx480-dual-engine-reverb",
  "lx480-essentials",
  "rev6000",
  "rev6000-essentials",
  "q82",
  "q82-essentials",
  "ace",
  "mea-2",
  "mla-4",
  "relab-176",
  "relab-color-drive",
];

const SKIP_SLUG_RE =
  /thank-you|coming-soon|sonicdays|support|contact|downloads|articles|terms|eula|receipts|nda|e-signature|player-test|about|store$/i;

function resolveRelabImage(html: string, pageUrl: string, slug: string): string | null {
  const keywords = slug.replace(/-/g, "");
  const matches = [
    ...html.matchAll(/https:\/\/[^"'\s]*relabdevelopment\.com[^"'\s]*\.(?:png|jpe?g|webp)/gi),
  ];

  let best: { url: string; score: number } | null = null;
  for (const match of matches) {
    const url = match[0];
    const lower = url.toLowerCase();
    if (/logo|icon|avatar|testimonial|article/i.test(lower)) continue;

    let score = 0;
    if (/product|plugin|interface|screen|hero|gui/i.test(lower)) score += 3;
    if (lower.includes(keywords.replace(/-/g, ""))) score += 4;

    if (!best || score > best.score) best = { url, score };
  }

  if (best?.score && best.score >= 3) return best.url;

  const og = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) return new URL(og[1], pageUrl).href;

  return null;
}

async function main() {
  const items: CatalogSourceItem[] = [];

  for (const slug of PRODUCT_SLUGS) {
    if (SKIP_SLUG_RE.test(slug)) continue;

    const pageUrl = `${BASE}/${slug}/`;
    const enriched = await enrichFromProductPage({
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl,
    });

    const html = await fetchPageHtml(pageUrl);
    const imageUrl =
      enriched.imageUrl ??
      (html ? resolveRelabImage(html, pageUrl, slug) : null);

    items.push({
      ...enriched,
      imageUrl,
      isBundle:
        slug === "bundle-upgrades" ||
        isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 120));
  }

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "RELAB_PRODUCTS",
    generatedBy: "scripts/build-relab-catalog.ts",
    outputFile: "lib/catalog/relab-products.ts",
    items,
    delayMs: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
