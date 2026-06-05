/**
 * Crawls antarestech.com product pages from sitemap and generates lib/catalog/antares-products.ts.
 *
 * Run: npm run build:antares-catalog
 */

import {
  buildCatalogFile,
  enrichFromProductPage,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { fetchPageHtml, normalizeProductSlug } from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "Antares";
const MANUFACTURER_TAG = "antares";
const BASE = "https://www.antarestech.com";

const SKIP_PATH_RE =
  /\/(overview|blogs|audio|tutorials|specs|mobile|subscriptions\/unlimited\/overview)$/i;

const CATEGORY_HUBS = new Set([
  "products",
  "auto-tune",
  "ai-powered-vocal-chain",
  "creative-vocal-effects",
  "subscriptions",
]);

async function discoverProductUrls(): Promise<string[]> {
  const xml = await fetchPageHtml(`${BASE}/sitemap.xml`);
  if (!xml) throw new Error("Could not load Antares sitemap");

  const locs = [
    ...xml.matchAll(/<loc>(https:\/\/www\.antarestech\.com\/products\/[^<]+)<\/loc>/gi),
  ].map((m) => m[1].replace(/\/$/, ""));

  const urls = new Set<string>();

  for (const url of locs) {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    if (parts[0] !== "products") continue;
    if (parts.length < 3) continue;
    if (SKIP_PATH_RE.test(pathname)) continue;

    const leaf = parts[parts.length - 1];
    if (CATEGORY_HUBS.has(leaf)) continue;

    urls.add(url);
  }

  return [...urls].sort();
}

function slugFromUrl(url: string): string {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  const leaf = parts[parts.length - 1] ?? "";
  const parent = parts.length >= 3 ? parts[parts.length - 2] : "";
  if (parent && parent !== "products" && parent !== "auto-tune") {
    return normalizeProductSlug(`${parent}-${leaf}`);
  }
  return normalizeProductSlug(leaf);
}

async function main() {
  console.log("Discovering Antares products from sitemap...");
  const urls = await discoverProductUrls();
  console.log(`Found ${urls.length} product URLs`);

  const items: CatalogSourceItem[] = [];

  for (const pageUrl of urls) {
    const slug = slugFromUrl(pageUrl);
    const enriched = await enrichFromProductPage({
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl,
    });

    items.push({
      ...enriched,
      isBundle: isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 100));
  }

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "ANTARES_PRODUCTS",
    generatedBy: "scripts/build-antares-catalog.ts",
    outputFile: "lib/catalog/antares-products.ts",
    items,
    delayMs: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
