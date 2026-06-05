/**
 * Crawls babyaud.io product pages (Playwright) and generates lib/catalog/baby-audio-products.ts.
 *
 * Run: npm run build:baby-audio-catalog
 */

import { chromium } from "playwright";
import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { processProductImageFromUrls } from "./lib/process-product-image";
import { fetchPageHtml } from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "Baby Audio";
const MANUFACTURER_TAG = "baby-audio";
const BASE = "https://www.babyaud.io";

const PRODUCT_PATHS = [
  "/taip-plugin",
  "/parallel-aggressor-plugin",
  "/comeback-kid-delay-plugin",
  "/i-heart-ny-parallel-compression-plugin",
  "/ihny-2",
  "/smooth-operator-plugin",
  "/spaced-out-plugin",
  "/super-vhs-multi-fx-plugin",
  "/crystalline",
  "/humanoid",
  "/grainferno",
  "/atoms",
  "/ba-1",
  "/tekno",
  "/transit",
  "/complete-bundle",
];

const SKIP_SEGMENTS = new Set([
  "expansion-packs",
  "freebies",
  "downloads",
  "support",
  "blog",
  "about",
  "checkout",
]);

function slugFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "";
  return segment.replace(/-plugin$/, "");
}

function pickBabyAudioImage(urls: string[], slug: string): string | null {
  const keywords = slug.replace(/-/g, " ").toLowerCase();
  const ranked = urls
    .filter(
      (u) =>
        u.includes("website-files.com") &&
        !/logo|favicon|avatar|\.svg/i.test(u) &&
        !/\*Greg|\*Dacota|\*Cesar|\*Max|\*Eestbound|\*Nick/i.test(u),
    )
    .map((url) => {
      const lower = url.toLowerCase();
      let score = 0;
      if (/\.avif|\.webp|\.png|\.jpe?g/i.test(lower)) score += 2;
      if (/\*[a-z]/.test(lower) || /interface|gui|screen|hero/i.test(lower)) {
        score += 5;
      }
      if (lower.includes(keywords.replace(/ /g, ""))) score += 4;
      if (lower.includes(keywords.split(" ")[0] ?? "")) score += 2;
      if (/icon/i.test(lower)) score -= 3;
      return { url, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score && ranked[0].score > 0 ? ranked[0].url : null;
}

async function discoverFromAllProducts(): Promise<string[]> {
  const html = await fetchPageHtml(`${BASE}/all-products`);
  const paths = new Set<string>(PRODUCT_PATHS);

  if (html) {
    for (const match of html.matchAll(/href="(\/[a-z0-9-]+(?:-plugin)?)"/gi)) {
      const pathname = match[1];
      const parts = pathname.split("/").filter(Boolean);
      if (parts.length !== 1) continue;
      if (SKIP_SEGMENTS.has(parts[0])) continue;
      if (/expansion|pack|freebie|download|support|blog|job|privacy|refund|grant/i.test(pathname)) {
        continue;
      }
      paths.add(pathname);
    }
  }

  return [...paths].sort();
}

async function main() {
  console.log("Discovering Baby Audio products...");
  const paths = await discoverFromAllProducts();
  console.log(`Found ${paths.length} product paths`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const items: CatalogSourceItem[] = [];

  for (const pathname of paths) {
    const pageUrl = `${BASE}${pathname}`;
    const slug = slugFromPath(pathname);

    try {
      await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(2000);

      const { title, imageUrls, priceText } = await page.evaluate(() => {
        const title =
          document.querySelector("h1")?.textContent?.trim() ??
          document.title.replace(/\s*\|.*/, "").trim();
        const imageUrls = [...document.querySelectorAll("img")]
          .map((img) => img.src)
          .filter(Boolean);
        const priceText = document.body.innerText.match(/\$\d+(?:\.\d{2})?/)?.[0];
        return { title, imageUrls, priceText };
      });

      const imageUrl = pickBabyAudioImage(imageUrls, slug);
      if (imageUrl) {
        await processProductImageFromUrls(slug, [imageUrl]);
      } else {
        console.warn(`  ✗ No image for ${slug}`);
      }

      const registeredPrice = priceText
        ? Math.round(Number.parseFloat(priceText.replace("$", "")) * 100) / 100
        : 0;

      items.push({
        name: title || slug.replace(/-/g, " "),
        slug,
        pageUrl,
        imageUrl,
        registeredPrice,
        isBundle: isBundleNameOrSlug(title ?? slug, slug),
      });
    } catch (error) {
      console.warn(`  ✗ Failed ${pageUrl}:`, error);
    }

    await new Promise((r) => setTimeout(r, 100));
  }

  await browser.close();

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "BABY_AUDIO_PRODUCTS",
    generatedBy: "scripts/build-baby-audio-catalog.ts",
    outputFile: "lib/catalog/baby-audio-products.ts",
    items,
    delayMs: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
