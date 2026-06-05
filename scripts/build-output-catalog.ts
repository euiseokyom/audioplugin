/**
 * Crawls output.com product pages and generates lib/catalog/output-products.ts.
 *
 * Run: npm run build:output-catalog
 */

import { chromium } from "playwright";
import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import {
  parseMetaProductPrice,
  parseTitleFromHtml,
  registeredPriceUsd,
} from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "Output";
const MANUFACTURER_TAG = "output";
const BASE = "https://output.com";

/** Core software products sold individually on output.com. */
const PRODUCT_PATHS = [
  "/arcade",
  "/portal",
  "/thermal",
  "/movement",
  "/analog-brass-and-winds",
  "/analog-strings",
  "/substance",
];

const SKIP_RE =
  /\/(all-products|blog|about|careers|support|privacy|terms|checkout|cart|login|signup|merch|tee|hoodie|drop)/i;

function slugFromPath(pathname: string): string {
  return (pathname.split("/").filter(Boolean).pop() ?? pathname)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function resolveOutputImage(html: string): string | null {
  const matches = [
    ...html.matchAll(/https:\/\/[^"'\s]*output\.com[^"'\s]*\.(?:png|jpe?g|webp)/gi),
  ];

  const ranked = matches
    .map((m) => m[0])
    .filter((u) => !/logo|icon|favicon|social|avatar/i.test(u))
    .sort((a, b) => b.length - a.length);

  return ranked[0] ?? null;
}

async function discoverPaths(browser: Awaited<ReturnType<typeof chromium.launch>>): Promise<string[]> {
  const page = await browser.newPage();
  const paths = new Set<string>();

  for (const seed of ["/", "/products", "/all-products"]) {
    try {
      await page.goto(`${BASE}${seed}`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForTimeout(2000);
      const hrefs = await page.evaluate(() =>
        [...document.querySelectorAll("a[href]")]
          .map((a) => (a as HTMLAnchorElement).pathname)
          .filter((p) => p.startsWith("/") && p.length > 1),
      );
      for (const pathname of hrefs) {
        if (SKIP_RE.test(pathname)) continue;
        if (/\/bundle$|\/rev$/.test(pathname)) continue;
        if (!/arcade|portal|thermal|movement|analog|substance|instrument|plugin|sampler/i.test(pathname)) {
          continue;
        }
        paths.add(pathname.replace(/\/$/, ""));
      }
    } catch {
      // continue
    }
  }

  for (const p of PRODUCT_PATHS) paths.add(p);

  await page.close();
  return [...paths].sort();
}

async function main() {
  console.log("Discovering Output products...");
  const browser = await chromium.launch({ headless: true });
  const paths = await discoverPaths(browser);
  console.log(`Found ${paths.length} product paths`);

  const items: CatalogSourceItem[] = [];
  const page = await browser.newPage();

  for (const pathname of paths) {
    const pageUrl = `${BASE}${pathname}`;
    const slug = slugFromPath(pathname);

    try {
      await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(1500);
      const html = await page.content();

      const title = parseTitleFromHtml(html);
      const priceMeta = parseMetaProductPrice(html);
      const imageUrl = resolveOutputImage(html);

      items.push({
        name: title ?? slug.replace(/-/g, " "),
        slug,
        pageUrl,
        imageUrl,
        registeredPrice: priceMeta
          ? registeredPriceUsd(priceMeta.amount, priceMeta.currency)
          : 0,
        isBundle: isBundleNameOrSlug(title ?? slug, slug),
      });
    } catch (error) {
      console.warn(`  ✗ Failed ${pageUrl}:`, error);
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  await browser.close();

  const deduped = items.filter(
    (item, index, arr) => arr.findIndex((x) => x.slug === item.slug) === index,
  );

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "OUTPUT_PRODUCTS",
    generatedBy: "scripts/build-output-catalog.ts",
    outputFile: "lib/catalog/output-products.ts",
    items: deduped,
    delayMs: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
