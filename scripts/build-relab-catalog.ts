/**
 * Crawls relabdevelopment.com product pages and generates lib/catalog/relab-products.ts.
 *
 * Run: npm run build:relab-catalog
 */

import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import {
  fetchPageHtml,
  normalizeRelabProductName,
  parseRelabRegisteredPrice,
  parseTitleFromHtml,
} from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";
import { DEFAULT_RETAILERS } from "../lib/catalog/manufacturer-retailers";

const MANUFACTURER = "Relab Development";
const MANUFACTURER_TAG = "relab-development";
const BASE = "https://relabdevelopment.com";

const SKIP_SLUGS = new Set([
  "about",
  "articles",
  "bundle-upgrades",
  "downloads",
  "feed",
  "lc-start",
  "privacy-policy",
  "store",
  "support",
  "terms-and-conditions",
  "wp-json",
  "thank-you",
  "coming-soon",
  "sonicdays",
  "contact",
  "eula",
  "receipts",
  "nda",
  "e-signature",
  "player-test",
]);

/** Official product names from relabdevelopment.com. */
const RELAB_NAMES: Record<string, string> = {
  "lx480-dual-engine-reverb": "LX480 Dual-Engine Reverb",
  "lx480-essentials": "LX480 Essentials",
  rev6000: "VSR REV6000",
  "rev6000-essentials": "REV6000 Essentials",
  q82: "Q82",
  "q82-essentials": "Q82 Essentials",
  ace: "Sonsig ACE",
  "sonsig-rev-a": "Sonsig Rev-A",
  "mea-2": "Maselec MEA-2",
  "mla-4": "Maselec MLA-4",
  "relab-176": "Relab 176",
  "relab-color-drive": "Relab Color Drive",
};

/** Official USD MSRP — fallback when page scrape misses reg. price. */
const RELAB_REGISTERED_PRICES: Record<string, number> = {
  "lx480-dual-engine-reverb": 349,
  "lx480-essentials": 99,
  rev6000: 199,
  "rev6000-essentials": 99,
  q82: 199,
  "q82-essentials": 99,
  ace: 99,
  "sonsig-rev-a": 149,
  "mea-2": 199,
  "mla-4": 199,
  "relab-176": 199,
  "relab-color-drive": 79,
};

function collectRelabImageUrls(html: string, pageUrl: string): string[] {
  const urls = new Set<string>();

  for (const match of html.matchAll(
    /https:\/\/[^"'\s]*relabdevelopment\.com\/wp-content\/uploads\/[^"'\s]+\.(?:png|jpe?g|webp)/gi,
  )) {
    urls.add(match[0].replace(/&amp;/g, "&"));
  }

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = new URL(match[1].replace(/&amp;/g, "&"), pageUrl).href;
      if (url.includes("relabdevelopment.com/wp-content/uploads")) {
        urls.add(url);
      }
    } catch {
      // skip invalid URLs
    }
  }

  return [...urls];
}

function pickRelabImage(urls: string[], slug: string): string | null {
  const slugParts = slug.split("-").filter((part) => part.length > 1);

  const ranked = urls
    .filter((url) => {
      const lower = url.toLowerCase();
      return (
        !/logo|icon|avatar|testimonial|512px_icon|150x150|300x300|thumbnail-dark|walkthrough|hero(?!.*gui)/i.test(
          lower,
        ) && !/\*[A-Z][a-z]/.test(url)
      );
    })
    .map((url) => {
      const lower = url.toLowerCase();
      let score = 0;

      if (/gui|interface|screen/i.test(lower)) score += 10;
      if (/icon/i.test(lower)) score -= 8;
      if (/hires|scaled|fullsize|stereo/i.test(lower)) score += 3;
      if (/\.png|\.webp|\.jpe?g/i.test(lower)) score += 2;

      for (const part of slugParts) {
        if (lower.includes(part)) score += 3;
      }

      if (slug === "ace" && /ace|sonsig/i.test(lower)) score += 4;
      if (slug === "sonsig-rev-a" && /sonsig|rev-a|reva/i.test(lower)) score += 4;
      if (slug === "relab-color-drive" && /color-drive/i.test(lower)) score += 5;
      if (slug === "relab-176" && /176|relab_176/i.test(lower)) score += 5;

      return { url, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].url : null;
}

function resolveRelabImage(html: string, pageUrl: string, slug: string): string | null {
  const urls = collectRelabImageUrls(html, pageUrl);
  const picked = pickRelabImage(urls, slug);
  if (picked) return picked;

  const og = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) {
    const ogUrl = new URL(og[1].replace(/&amp;/g, "&"), pageUrl).href;
    if (!/icon|logo|512px/i.test(ogUrl)) return ogUrl;
  }

  return null;
}

function parseRelabName(html: string, slug: string): string {
  if (RELAB_NAMES[slug]) return RELAB_NAMES[slug];

  const title = parseTitleFromHtml(html);
  if (title) return normalizeRelabProductName(title);

  return slug.replace(/-/g, " ");
}

async function discoverRelabProducts(): Promise<string[]> {
  const html = await fetchPageHtml(`${BASE}/`);
  if (!html) throw new Error("Could not load Relab homepage");

  const slugs = new Set<string>();
  for (const match of html.matchAll(
    /href="https:\/\/relabdevelopment\.com\/([a-z0-9-]+)\/"/gi,
  )) {
    const slug = match[1];
    if (SKIP_SLUGS.has(slug)) continue;
    slugs.add(slug);
  }

  return [...slugs].sort();
}

async function main() {
  console.log("Discovering Relab products...");
  const slugs = await discoverRelabProducts();
  console.log(`Found ${slugs.length} products`);

  const items: CatalogSourceItem[] = [];

  for (const slug of slugs) {
    const pageUrl = `${BASE}/${slug}/`;
    const html = await fetchPageHtml(pageUrl);
    if (!html) {
      console.warn(`  ✗ Could not load ${pageUrl}`);
      continue;
    }

    const name = parseRelabName(html, slug);
    const registeredPrice =
      parseRelabRegisteredPrice(html) ??
      RELAB_REGISTERED_PRICES[slug] ??
      0;
    const imageUrl = resolveRelabImage(html, pageUrl, slug);

    items.push({
      name,
      slug,
      pageUrl,
      registeredPrice,
      imageUrl,
      isBundle: isBundleNameOrSlug(name, slug),
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
    retailers: [...DEFAULT_RETAILERS],
    delayMs: 0,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
