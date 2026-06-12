/**
 * Gear4music product lookup for manufacturer catalog images.
 * Product pages expose og:image URLs on r2.gear4music.com (1200px square shots).
 */

import { chromium } from "playwright";

const GEAR4MUSIC_ANTARES_URL = "https://www.gear4music.com/Antares.html";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

export type Gear4musicProduct = {
  title: string;
  pageUrl: string;
  imageUrl: string;
  catalogSlug: string | null;
};

const TITLE_TO_CATALOG_SLUG: Array<[RegExp, string]> = [
  [/auto-?tune pro 11/i, "pro"],
  [/autotune 2026|auto-?tune 2026/i, "at2026"],
  [/auto-?key 2/i, "auto-key"],
  [/auto-?tune hybrid/i, "hybrid"],
  [/harmony engine/i, "creative-vocal-effects-harmony-engine"],
  [/auto-?tune vocal eq/i, "vocal-eq"],
  [/vocal compressor/i, "vocal-compressor"],
  [/vocal de-esser/i, "ai-powered-vocal-chain-vocal-de-esser"],
  [/vocal prep/i, "ai-powered-vocal-chain-vocal-prep"],
  [/auto-?tune vocal reverb/i, "ai-powered-vocal-chain-vocal-reverb"],
  [/auto-?tune vocodist/i, "vocodist"],
  [/^antares choir$/i, "creative-vocal-effects-choir"],
  [/aspire/i, "creative-vocal-effects-aspire"],
  [/articulator/i, "creative-vocal-effects-articulator"],
  [/throat/i, "creative-vocal-effects-throat"],
  [/metamorph/i, "creative-vocal-effects-metamorph"],
  [/mic mod/i, "creative-vocal-effects-mic-mod"],
  [/duo/i, "creative-vocal-effects-duo"],
  [/mutator/i, "creative-vocal-effects-mutator"],
  [/punch/i, "creative-vocal-effects-punch"],
  [/warm/i, "creative-vocal-effects-warm"],
  [/efx\+|efx plus/i, "efx-plus"],
];

export function mapGear4musicTitleToCatalogSlug(title: string): string | null {
  const normalized = title.trim();
  for (const [pattern, slug] of TITLE_TO_CATALOG_SLUG) {
    if (pattern.test(normalized)) return slug;
  }
  return null;
}

/** Prefer full-size CDN path when og:image uses a smaller variant. */
export function upgradeGear4musicImageUrl(url: string): string {
  return url
    .replace(/\/(\d+)\/preview(_\d+)?\.(jpg|jpeg|png|webp)/i, "/1200/preview$2.$3")
    .replace(/\/76\//, "/1200/")
    .replace(/\/132\//, "/1200/")
    .replace(/\/215\//, "/1200/")
    .replace(/\/600\//, "/1200/");
}

export function matchGear4musicAntaresProduct(
  products: Gear4musicProduct[],
  catalogSlug: string,
): Gear4musicProduct | null {
  return products.find((product) => product.catalogSlug === catalogSlug) ?? null;
}

export async function discoverGear4musicAntaresProducts(): Promise<
  Gear4musicProduct[]
> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "en-GB",
  });
  const page = await context.newPage();

  try {
    await page.goto(GEAR4MUSIC_ANTARES_URL, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(4_000);

    const pageUrls = await page.evaluate(() => {
      const urls = new Set<string>();
      for (const anchor of document.querySelectorAll(
        'a[href*="/Recording-and-Computers/Antares-"]',
      )) {
        const href = (anchor as HTMLAnchorElement).href;
        if (/Unlimited|Subscription/i.test(href)) continue;
        urls.add(href.split("?")[0]!);
      }
      return [...urls];
    });

    const products: Gear4musicProduct[] = [];

    for (const pageUrl of pageUrls) {
      await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForTimeout(2_000);

      const scraped = await page.evaluate(() => {
        const title =
          document.querySelector("h1")?.textContent?.trim() ??
          document.title.replace(/\s*at Gear4music.*/i, "").trim();
        const og =
          document
            .querySelector('meta[property="og:image"]')
            ?.getAttribute("content") ?? "";
        const media = [
          ...document.documentElement.innerHTML.matchAll(
            /https:\/\/r2\.gear4music\.com\/media\/\d+\/\d+\/1200\/[^"'\s]+/g,
          ),
        ].map((match) => match[0]);
        return { title, og, media: [...new Set(media)] };
      });

      const imageUrl = upgradeGear4musicImageUrl(
        scraped.og || scraped.media[0] || "",
      );
      if (!imageUrl || !scraped.title) continue;

      products.push({
        title: scraped.title,
        pageUrl,
        imageUrl,
        catalogSlug: mapGear4musicTitleToCatalogSlug(scraped.title),
      });

      await page.waitForTimeout(1_200);
    }

    return products;
  } finally {
    await browser.close();
  }
}
