/**
 * Crawls slatedigital.com/plugins with Playwright and generates
 * lib/catalog/slate-products.ts + images.
 *
 * Run: npm run build:slate-catalog
 */

import { chromium, type Browser } from "playwright";
import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";
import {
  parseMetaProductPrice,
  parseTitleFromHtml,
  registeredPriceUsd,
  resolveProductImage,
} from "./lib/page-scrape";

const MANUFACTURER = "Slate Digital";
const MANUFACTURER_TAG = "slate-digital";
const PLUGINS_URL = "https://slatedigital.com/plugins/";

const SLATE_SKIP_SLUGS = new Set([
  "plugins",
  "about",
  "academy",
  "blog",
  "careers",
  "complete-access",
  "education-pricing",
  "feed",
  "find-a-dealer",
  "legacy-products",
  "privacy-policy",
  "sitemap",
  "xmlrpc",
  "wp-admin",
  "wp-includes",
  "ml-1a-modeling-microphone",
  "ml-2a-modeling-microphone",
  "ml2-modeling-microphone",
  "microphone-models",
  "virtual-microphone-system",
  "virtu-mastering-software",
  "virtu-online-mastering-software",
]);

function isSlatePluginSlug(slug: string): boolean {
  if (SLATE_SKIP_SLUGS.has(slug)) return false;
  if (/^ml\d?-/i.test(slug) || slug.startsWith("ml-")) return false;

  return (
    /plugin/i.test(slug) ||
    /bundle/i.test(slug) ||
    /^(fg-|sd-|vmr|vbc|vtm|vtc|vpc|infinity-|virtual-|eiosis-|custom-|metapitch|metatune|mo-tt|verbsuite|fresh-air|revival|heatwave|murda|storch|submerge|repeater|lustrous|stellar|rotary|transient|the-monster|bus-clipper|audified|kilohearts|ana2|fg-x)/i.test(
      slug,
    )
  );
}

const SLATE_JUNK_IMAGE = /logo|icon|favicon|avatar|cropped-Untitled|menu-bg|banner|halloween|menu-featured/i;

function resolveSlateProductImage(html: string, pageUrl: string): string | null {
  const og = resolveProductImage(html, pageUrl);
  if (og && !/slatedigital\.local/i.test(og)) return og;

  const uploads = html.match(
    /https:\/\/slatedigital\.com\/wp-content\/uploads\/[^"'\s]+\.(?:png|jpe?g|webp)/gi,
  );
  if (!uploads?.length) return null;

  const ranked = uploads
    .filter((u) => !SLATE_JUNK_IMAGE.test(u))
    .sort((a, b) => b.length - a.length);

  return ranked[0] ?? null;
}

async function enrichSlateProduct(
  browser: Browser,
  pageUrl: string,
): Promise<CatalogSourceItem> {
  const slug = pageUrl.split("/").filter(Boolean).pop() ?? "";
  const page = await browser.newPage();

  try {
    await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForTimeout(1500);
    const html = await page.content();

    const title = parseTitleFromHtml(html);
    const priceMeta = parseMetaProductPrice(html);
    const imageUrl = resolveSlateProductImage(html, pageUrl);

    return {
      name: title ?? slug.replace(/-/g, " "),
      slug,
      pageUrl,
      imageUrl,
      registeredPrice: priceMeta
        ? registeredPriceUsd(priceMeta.amount, priceMeta.currency)
        : undefined,
      isBundle: isBundleNameOrSlug(title ?? slug, slug),
    };
  } finally {
    await page.close();
  }
}

async function discoverAndEnrichSlate(): Promise<CatalogSourceItem[]> {
  const browser = await chromium.launch({ headless: true });
  const items: CatalogSourceItem[] = [];

  try {
    const urls = await discoverSlatePluginUrls(browser);
    console.log(`Found ${urls.length} plugin URLs`);

    for (const pageUrl of urls) {
      items.push(await enrichSlateProduct(browser, pageUrl));
      await new Promise((r) => setTimeout(r, 150));
    }
  } finally {
    await browser.close();
  }

  return items;
}

async function discoverSlatePluginUrls(browser: Browser): Promise<string[]> {
  const page = await browser.newPage();
  const links = new Set<string>();

  page.on("response", async (res) => {
    if (!res.url().includes("slatedigital")) return;
    try {
      const text = await res.text();
      const abs =
        text.match(/https:\/\/slatedigital\.com\/[a-z0-9-]+/gi) ?? [];
      for (const href of abs) {
        const slug = href.split("/").filter(Boolean).pop() ?? "";
        if (isSlatePluginSlug(slug)) {
          links.add(href.replace(/\/$/, "").split("?")[0]);
        }
      }
    } catch {
      // ignore
    }
  });

  try {
    await page.goto(
      `${PLUGINS_URL}?current_page=1&page_size=48&view_type=list`,
      { waitUntil: "networkidle", timeout: 120_000 },
    );
    await page.waitForTimeout(5000);

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      const more = page.locator("a").filter({ hasText: /load more|show more/i });
      if ((await more.count()) > 0) {
        await more.first().click({ timeout: 5000 }).catch(() => undefined);
        await page.waitForTimeout(2000);
      }
    }

    const domLinks = await page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => h.startsWith("https://slatedigital.com/")),
    );

    for (const href of domLinks) {
      const slug = href.split("/").filter(Boolean).pop()?.split("?")[0] ?? "";
      if (isSlatePluginSlug(slug)) {
        links.add(href.replace(/\/$/, "").split("?")[0]);
      }
    }
  } finally {
    await page.close();
  }

  return [...links].sort();
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
    delayMs: 0,
    processingProfile: "light",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
