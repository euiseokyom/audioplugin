/**
 * Crawls slatedigital.com/plugins with Playwright and generates
 * lib/catalog/slate-products.ts + images.
 *
 * Run: npm run build:slate-catalog
 */

import { chromium, type Browser, type Page } from "playwright";
import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { DEFAULT_RETAILERS } from "../lib/catalog/manufacturer-retailers";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";
import {
  normalizeSlateProductName,
  parseMetaProductPrice,
  parseTitleFromHtml,
  registeredPriceUsd,
  shouldSkipSlateCatalogItem,
} from "./lib/page-scrape";
import { resolveSlatePluginFoxImageUrl } from "./lib/slate-pluginfox";

const MANUFACTURER = "Slate Digital";
const MANUFACTURER_TAG = "slate-digital";
const PLUGINS_URL = "https://slatedigital.com/plugins/";

type SlateListingItem = {
  slug: string;
  name: string;
  pageUrl: string;
  listingImageUrl?: string | null;
};

async function loadAllPluginCards(page: Page): Promise<SlateListingItem[]> {
  await page.goto(
    `${PLUGINS_URL}?current_page=1&page_size=48&view_type=list`,
    { waitUntil: "networkidle", timeout: 120_000 },
  );
  await page.waitForTimeout(4000);

  const seen = new Map<string, SlateListingItem>();

  for (let round = 0; round < 12; round++) {
    const batch = await page.evaluate(() => {
      const items: Array<{
        slug: string;
        name: string;
        pageUrl: string;
        listingImageUrl: string | null;
      }> = [];

      for (const card of document.querySelectorAll(".plugin-list-item")) {
        const title = card.querySelector("h3.plugin-item-title");
        const link =
          title?.closest("a") ??
          card.querySelector("a[href*='slatedigital.com']");
        if (!title || !link) continue;

        const href = (link as HTMLAnchorElement).href.split("?")[0].replace(/\/$/, "");
        const slug = href.split("/").filter(Boolean).pop() ?? "";
        const name = title.textContent?.trim() ?? "";
        const listingImageUrl =
          card.querySelector("img[src*='wp-content/uploads']")?.getAttribute("src") ??
          null;
        if (!slug || !name) continue;
        items.push({ slug, name, pageUrl: href, listingImageUrl });
      }

      return items;
    });

    for (const item of batch) {
      if (!seen.has(item.slug)) seen.set(item.slug, item);
    }

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1200);

    const more = page.locator("a").filter({ hasText: /load more|show more/i });
    if ((await more.count()) > 0) {
      await more.first().click({ timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(2000);
    }
  }

  return [...seen.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

async function enrichSlateProduct(
  browser: Browser,
  listing: SlateListingItem,
): Promise<CatalogSourceItem | null> {
  if (shouldSkipSlateCatalogItem(listing)) return null;

  const page = await browser.newPage();

  try {
    await page.goto(listing.pageUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(1500);
    const html = await page.content();

    const title = parseTitleFromHtml(html);
    const priceMeta = parseMetaProductPrice(html);
    const isBundle = isBundleNameOrSlug(listing.name, listing.slug);
    const imageUrl = await resolveSlatePluginFoxImageUrl(listing.slug);

    const name = normalizeSlateProductName(
      listing.name || title || listing.slug.replace(/-/g, " "),
      listing.slug,
    );

    return {
      name,
      slug: listing.slug,
      pageUrl: listing.pageUrl,
      imageUrl,
      registeredPrice: priceMeta
        ? registeredPriceUsd(priceMeta.amount, priceMeta.currency)
        : 0,
      isBundle,
    };
  } finally {
    await page.close();
  }
}

async function discoverAndEnrichSlate(): Promise<CatalogSourceItem[]> {
  const browser = await chromium.launch({ headless: true });
  const items: CatalogSourceItem[] = [];

  try {
    const page = await browser.newPage();
    const listings = await loadAllPluginCards(page);
    await page.close();

    console.log(`Found ${listings.length} plugin cards`);

    for (const listing of listings) {
      if (shouldSkipSlateCatalogItem(listing)) continue;

      const enriched = await enrichSlateProduct(browser, listing);
      if (enriched) items.push(enriched);
      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    await browser.close();
  }

  return items;
}

async function main() {
  console.log("Discovering Slate Digital plugins (Playwright)...");
  const items = await discoverAndEnrichSlate();
  console.log(`Enriched ${items.length} products`);

  await buildCatalogFile({
    manufacturer: MANUFACTURER,
    manufacturerTag: MANUFACTURER_TAG,
    exportName: "SLATE_PRODUCTS",
    generatedBy: "scripts/build-slate-catalog.ts",
    outputFile: "lib/catalog/slate-products.ts",
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
