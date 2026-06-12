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
import { fetchPageHtml } from "./lib/page-scrape";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";

const MANUFACTURER = "Baby Audio";
const MANUFACTURER_TAG = "baby-audio";
const BASE = "https://www.babyaud.io";

/** Official USD MSRP — babyaud.io renders KRW in h1 outside the US. */
const BABY_AUDIO_PRICES: Record<string, number> = {
  taip: 69,
  "parallel-aggressor": 49,
  "comeback-kid-delay": 49,
  "ihny-2": 49,
  "smooth-operator": 49,
  "spaced-out": 49,
  "super-vhs-multi-fx": 49,
  crystalline: 69,
  humanoid: 49,
  grainferno: 59,
  atoms: 59,
  "ba-1": 69,
  tekno: 89,
  transit: 69,
  "complete-bundle": 199,
};

const BABY_AUDIO_NAMES: Record<string, string> = {
  taip: "TAIP",
  "parallel-aggressor": "Parallel Aggressor",
  "comeback-kid-delay": "Comeback Kid",
  "ihny-2": "I Heart NY 2",
  "smooth-operator": "Smooth Operator",
  "spaced-out": "Spaced Out",
  "super-vhs-multi-fx": "Super VHS",
  crystalline: "Crystalline",
  humanoid: "Humanoid",
  grainferno: "Grainferno",
  atoms: "Atoms",
  "ba-1": "BA-1",
  tekno: "Tekno",
  transit: "Transit",
  "complete-bundle": "Complete Bundle",
};

const SKIP_SEGMENTS = new Set([
  "all-products",
  "expansion-packs",
  "freebies",
  "downloads",
  "support",
  "blog",
  "about",
  "checkout",
  "jobs",
  "privacy-policy",
  "refund-policy",
  "grants-for-good",
]);

function parseBabyAudioName(docTitle: string, slug: string): string {
  if (BABY_AUDIO_NAMES[slug]) return BABY_AUDIO_NAMES[slug];
  const byMatch = docTitle.match(/^(.+?)\s+by\s+Baby Audio/i);
  if (byMatch) return byMatch[1].trim();
  return docTitle.replace(/\s*[-|].*$/, "").trim() || slug.replace(/-/g, " ");
}

function isPriceHeading(text: string): boolean {
  return /^[$₩€£][\d,]/.test(text.trim());
}

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
      if (/gui|interface|screen/i.test(lower)) score += 10;
      if (/\*[a-z]/.test(lower) && !/gui|interface|screen/i.test(lower)) score += 1;
      else if (/hero/i.test(lower)) score += 5;
      if (lower.includes(keywords.replace(/ /g, ""))) score += 4;
      if (lower.includes(keywords.split(" ")[0] ?? "")) score += 2;
      if (/icon/i.test(lower)) score -= 8;
      return { url, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score && ranked[0].score > 0 ? ranked[0].url : null;
}

async function discoverFromAllProducts(): Promise<string[]> {
  const html = await fetchPageHtml(`${BASE}/all-products`);
  const paths = new Set<string>();

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

      const { h1, docTitle, imageUrls, priceText } = await page.evaluate(() => {
        const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
        const imageUrls = [...document.querySelectorAll("img")]
          .map((img) => img.src)
          .filter(Boolean);
        const priceText =
          document.body.innerText.match(/\$\d+(?:\.\d{2})?/)?.[0] ??
          document
            .querySelector("[class*='price'], [data-price]")
            ?.textContent?.match(/\$\d+(?:\.\d{2})?/)?.[0];
        return { h1, docTitle: document.title, imageUrls, priceText };
      });

      const name = parseBabyAudioName(docTitle, slug);
      if (!name || (isPriceHeading(h1) && !BABY_AUDIO_NAMES[slug])) {
        continue;
      }

      const imageUrl = pickBabyAudioImage(imageUrls, slug);
      const registeredPrice =
        BABY_AUDIO_PRICES[slug] ??
        (priceText
          ? Math.round(Number.parseFloat(priceText.replace("$", "")) * 100) / 100
          : 0);

      items.push({
        name,
        slug,
        pageUrl,
        imageUrl,
        registeredPrice,
        isBundle: isBundleNameOrSlug(name, slug),
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
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
