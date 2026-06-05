/**
 * Crawls xlnaudio.com main instruments/effects and generates lib/catalog/xln-products.ts.
 *
 * Run: npm run build:xln-catalog
 */

import { chromium } from "playwright";
import {
  buildCatalogFile,
  enrichFromProductPage,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { fetchPageHtml } from "./lib/page-scrape";
import { processProductImageFromUrls } from "./lib/process-product-image";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "XLN Audio";
const MANUFACTURER_TAG = "xln-audio";
const BASE = "https://www.xlnaudio.com";

/** Individually sold core products (not ADpaks / MIDI / kit pieces / expansions). */
const CORE_PRODUCT_PATHS = [
  "/products/addictive_drums_2",
  "/products/addictive_keys",
  "/products/addictive_trigger",
  "/products/xo",
  "/products/life",
  "/products/addictive_fx/effect/rc-20_retro_color",
  "/products/addictive_fx/effect/ds-10_drum_shaper",
  "/products/addictive_fx/effect/db-30_drum_butter",
];

const SKIP_PATH_RE =
  /\/(adpak|midipak|kitpiecepak|expansion|collections|rent_to_own)\b/i;

function slugFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment.replace(/_/g, "-");
}

function resolveXlnImage(html: string, slug: string): string | null {
  const keywords = slug.replace(/-/g, "");
  const matches = [
    ...html.matchAll(
      /https:\/\/assets\.xlnaudio\.com\/[^"'\s]+\.(?:png|jpe?g|webp)/gi,
    ),
    ...html.matchAll(/https:\/\/[^"'\s]*xlnaudio\.com[^"'\s]*\.(?:png|jpe?g|webp)/gi),
  ];

  let best: { url: string; score: number } | null = null;
  for (const match of matches) {
    const url = match[0];
    const lower = url.toLowerCase();
    if (/logo|icon|favicon|sprite|banner|social|sitewide|navigation/i.test(lower)) {
      continue;
    }

    let score = 0;
    if (/screenshot|overview|mainimage|boxshot/i.test(lower)) score += 5;
    if (/product|plugin|screen|interface|hero|feature/i.test(lower)) score += 3;
    if (lower.includes(keywords)) score += 4;

    if (!best || score > best.score) best = { url, score };
  }

  return best?.score && best.score >= 3 ? best.url : null;
}

async function resolveXlnImageWithPlaywright(
  pageUrl: string,
  slug: string,
): Promise<string | null> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(2000);
    const urls = await page.evaluate(() =>
      [...document.querySelectorAll("img")]
        .map((img) => img.src)
        .filter((src) => src.includes("xlnaudio.com") || src.includes("assets.xln")),
    );
    const html = urls.join("\n");
    return resolveXlnImage(html, slug);
  } finally {
    await browser.close();
  }
}

async function discoverCoreProducts(): Promise<string[]> {
  const html = await fetchPageHtml(`${BASE}/products`);
  const paths = new Set<string>(CORE_PRODUCT_PATHS);

  if (html) {
    for (const match of html.matchAll(/href="(\/products\/[^"#?]+)"/gi)) {
      const pathname = match[1].replace(/\/$/, "");
      if (SKIP_PATH_RE.test(pathname)) continue;
      const depth = pathname.split("/").filter(Boolean).length;
      if (depth < 2 || depth > 4) continue;
      paths.add(pathname);
    }
  }

  return [...paths]
    .filter((p) => !SKIP_PATH_RE.test(p))
    .sort();
}

async function main() {
  console.log("Discovering XLN Audio products...");
  const paths = await discoverCoreProducts();
  console.log(`Found ${paths.length} product paths`);

  const items: CatalogSourceItem[] = [];

  for (const pathname of paths) {
    const pageUrl = `${BASE}${pathname}`;
    const slug = slugFromPath(pathname);
    const enriched = await enrichFromProductPage({
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl,
    });

    const html = await fetchPageHtml(pageUrl);
    let imageUrl =
      enriched.imageUrl ?? (html ? resolveXlnImage(html, slug) : null);
    if (!imageUrl) {
      imageUrl = await resolveXlnImageWithPlaywright(pageUrl, slug);
    }
    if (imageUrl) {
      await processProductImageFromUrls(slug, [imageUrl]);
    }

    items.push({
      ...enriched,
      imageUrl,
      isBundle: isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 150));
  }

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "XLN_PRODUCTS",
    generatedBy: "scripts/build-xln-catalog.ts",
    outputFile: "lib/catalog/xln-products.ts",
    items,
    delayMs: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
