/**
 * Fetches the full Waves plugin + bundle catalog from waves.com,
 * downloads product images, and generates lib/catalog/waves-products.ts.
 *
 * Run: npm run build:waves-catalog
 *
 * Waves blocks automated browsers; cache HTML under scripts/waves-cache/
 * (see scripts/waves-cache/README.md).
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import {
  categoryToTag,
  mapWavesCategory,
} from "../lib/catalog/waves-category-map";
import { processProductImageFromUrls } from "./lib/process-product-image";
import { WAVES_BUNDLE_SLUGS } from "../lib/catalog/waves-bundle-slugs";
import { WAVES_NOT_INDIVIDUALLY_SOLD } from "../lib/catalog/waves-not-individually-sold";
import { DEFAULT_RETAILERS } from "../lib/catalog/manufacturer-retailers";
import { productImageUrl } from "../lib/catalog/product-image-path";
import type { SeedProduct } from "../lib/catalog/seed-product";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CACHE_DIR = path.join(ROOT, "scripts/waves-cache");
const BUNDLE_CACHE_DIR = path.join(CACHE_DIR, "bundles");
const MANUFACTURER_TAG = "waves";
const OUTPUT_FILE = path.join(ROOT, "lib/catalog/waves-products.ts");

const PLUGIN_CACHE_FILES = [
  path.join(CACHE_DIR, "subscriptions-ultimate.html"),
  path.join(CACHE_DIR, "free-plugin-pack.html"),
];

type WavesRawProduct = {
  documentName: string;
  documentUrlPath: string;
  thumb?: string;
  msrp?: number;
  skuPrice?: number;
  gsfCategory?: string;
};

function slugFromPath(documentUrlPath: string): string {
  return documentUrlPath.split("/").filter(Boolean).pop() ?? documentUrlPath;
}

function isBlockedHtml(html: string): boolean {
  return (
    html.length < 5000 ||
    html.includes("Incapsula incident ID") ||
    html.includes("Pardon Our Interruption")
  );
}

function parseProductsFromHtml(
  html: string,
  pathPrefix: "/plugins/" | "/bundles/",
): WavesRawProduct[] {
  const byPath = new Map<string, WavesRawProduct>();
  const marker = `"documentUrlPath":"${pathPrefix}`;
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const idx = html.indexOf(marker, searchFrom);
    if (idx === -1) break;

    let start = html.lastIndexOf('{"nodeGUID"', idx);
    if (start === -1) start = html.lastIndexOf("{", idx);

    let depth = 0;
    let end = start;
    for (let i = start; i < html.length; i++) {
      if (html[i] === "{") depth++;
      if (html[i] === "}") {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    try {
      const obj = JSON.parse(html.slice(start, end)) as WavesRawProduct;
      if (
        obj.documentUrlPath?.startsWith(pathPrefix) &&
        obj.documentName &&
        !obj.documentUrlPath.startsWith("/subscriptions/")
      ) {
        byPath.set(obj.documentUrlPath, obj);
      }
    } catch {
      // skip malformed JSON fragments
    }

    searchFrom = idx + marker.length;
  }

  return [...byPath.values()];
}

function parseBundleMetadata(
  html: string,
  expectedSlug: string,
): WavesRawProduct | null {
  const products = parseProductsFromHtml(html, "/bundles/");
  return (
    products.find(
      (p) => slugFromPath(p.documentUrlPath) === expectedSlug,
    ) ?? null
  );
}

async function readCacheIfExists(filePath: string): Promise<string | null> {
  try {
    const html = await fs.readFile(filePath, "utf8");
    return isBlockedHtml(html) ? null : html;
  } catch {
    return null;
  }
}

async function fetchHtmlLive(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return isBlockedHtml(html) ? null : html;
  } catch {
    return null;
  }
}

async function fetchHtmlWithPlaywright(url: string): Promise<string | null> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180_000 });
    await page.waitForTimeout(8000);
    const html = await page.content();
    return isBlockedHtml(html) ? null : html;
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}

async function loadHtml(url: string, cachePath: string): Promise<string | null> {
  const cached = await readCacheIfExists(cachePath);
  if (cached) return cached;

  let html = await fetchHtmlLive(url);
  if (html) {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, html, "utf8");
    return html;
  }

  html = await fetchHtmlWithPlaywright(url);
  if (html) {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, html, "utf8");
    return html;
  }

  return null;
}

function resolveThumbUrl(
  thumb: string | undefined,
  slug: string,
  isBundle: boolean,
): string[] {
  const candidates: string[] = [];

  if (thumb) {
    if (thumb.startsWith("http")) {
      candidates.push(thumb);
    } else {
      candidates.push(`https://media.wavescdn.com${thumb}`);
      candidates.push(`https://www.waves.com${thumb}`);
    }
  }

  const folder = isBundle ? "bundles" : "plugins";
  candidates.push(
    `https://media.wavescdn.com/images/products/${folder}/600/${slug}.png`,
  );

  return [...new Set(candidates)];
}

async function processProductImage(
  slug: string,
  thumb: string | undefined,
  isBundle: boolean,
): Promise<boolean> {
  const urls = resolveThumbUrl(thumb, slug, isBundle);
  return processProductImageFromUrls(slug, urls, {
    manufacturerTag: MANUFACTURER_TAG,
  });
}

function normalizeProduct(raw: WavesRawProduct, isBundle: boolean): SeedProduct {
  const slug = slugFromPath(raw.documentUrlPath);
  const category = mapWavesCategory(
    raw.gsfCategory ?? "",
    isBundle,
    raw.documentName,
    slug,
  );
  const registeredPrice =
    raw.msrp && raw.msrp > 0
      ? Math.round(raw.msrp * 100) / 100
      : Math.round((raw.skuPrice ?? 0) * 100) / 100;

  const tags = new Set<string>(["waves", categoryToTag(category)]);
  if (isBundle) tags.add("bundle");
  if (raw.gsfCategory) {
    tags.add(
      raw.gsfCategory
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  return {
    name: raw.documentName,
    slug,
    canonicalId: `${slug}-waves`,
    image: productImageUrl(MANUFACTURER_TAG, slug),
    category,
    manufacturer: "Waves",
    registeredPrice,
    tags: [...tags].filter(Boolean),
    retailers: [...DEFAULT_RETAILERS],
  };
}

function serializeProducts(products: SeedProduct[]): string {
  const lines = products.map((p) => {
    const tags = p.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ");
    return `  {
    name: ${JSON.stringify(p.name)},
    slug: ${JSON.stringify(p.slug)},
    canonicalId: ${JSON.stringify(p.canonicalId)},
    image: ${JSON.stringify(p.image)},
    category: ${JSON.stringify(p.category)},
    manufacturer: "Waves",
    registeredPrice: ${p.registeredPrice},
    tags: [${tags}],
    retailers: [${DEFAULT_RETAILERS.map((r) => JSON.stringify(r)).join(", ")}],
  }`;
  });

  return `/** Generated by scripts/build-waves-catalog.ts — do not edit manually. */
import type { SeedProduct } from "@/lib/catalog/seed-product";

export const WAVES_PRODUCTS: SeedProduct[] = [
${lines.join(",\n")}
];
`;
}

function mergeWavesProduct(
  existing: WavesRawProduct | undefined,
  incoming: WavesRawProduct,
): WavesRawProduct {
  if (!existing) return incoming;

  const existingMsrp = existing.msrp ?? 0;
  const incomingMsrp = incoming.msrp ?? 0;
  const existingSku = existing.skuPrice ?? 0;
  const incomingSku = incoming.skuPrice ?? 0;

  if (incomingMsrp > existingMsrp) return incoming;
  if (existingMsrp > incomingMsrp) return existing;
  if (incomingSku > existingSku) return incoming;
  return existing;
}

async function loadPlugins(): Promise<WavesRawProduct[]> {
  const byPath = new Map<string, WavesRawProduct>();

  for (const cacheFile of PLUGIN_CACHE_FILES) {
    const html = await readCacheIfExists(cacheFile);
    if (!html) {
      console.warn(`Missing plugin cache: ${path.relative(ROOT, cacheFile)}`);
      continue;
    }
    for (const product of parseProductsFromHtml(html, "/plugins/")) {
      byPath.set(
        product.documentUrlPath,
        mergeWavesProduct(byPath.get(product.documentUrlPath), product),
      );
    }
  }

  if (byPath.size === 0) {
    const url = "https://www.waves.com/subscriptions/ultimate";
    const html = await loadHtml(
      url,
      path.join(CACHE_DIR, "subscriptions-ultimate.html"),
    );
    if (html) {
      for (const product of parseProductsFromHtml(html, "/plugins/")) {
        byPath.set(product.documentUrlPath, product);
      }
    }
  }

  return [...byPath.values()];
}

async function loadBundles(): Promise<WavesRawProduct[]> {
  const byPath = new Map<string, WavesRawProduct>();

  for (const slug of WAVES_BUNDLE_SLUGS) {
    const url = `https://www.waves.com/bundles/${slug}`;
    const cachePath = path.join(BUNDLE_CACHE_DIR, `${slug}.html`);
    const html = await loadHtml(url, cachePath);
    if (!html) continue;

    const bundle = parseBundleMetadata(html, slug);
    if (bundle) {
      byPath.set(bundle.documentUrlPath, bundle);
    }
  }

  return [...byPath.values()];
}

async function main() {
  console.log("Loading Waves plugin catalog...");
  const plugins = await loadPlugins();
  console.log(`Found ${plugins.length} plugins`);

  console.log("Loading Waves bundle catalog...");
  const bundles = await loadBundles();
  console.log(`Found ${bundles.length} bundles`);

  const rawBySlug = new Map<string, WavesRawProduct>();
  for (const raw of [...plugins, ...bundles]) {
    rawBySlug.set(slugFromPath(raw.documentUrlPath), raw);
  }

  const bySlug = new Map<string, SeedProduct>();
  for (const raw of plugins) {
    const product = normalizeProduct(raw, false);
    bySlug.set(product.slug, product);
  }
  for (const raw of bundles) {
    const product = normalizeProduct(raw, true);
    bySlug.set(product.slug, product);
  }

  const products = [...bySlug.values()]
    .filter((p) => !WAVES_NOT_INDIVIDUALLY_SOLD.has(p.slug))
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`Processing images for ${products.length} products...`);
  let imageSuccess = 0;
  for (const [i, product] of products.entries()) {
    const raw = rawBySlug.get(product.slug);
    const ok = await processProductImage(
      product.slug,
      raw?.thumb,
      product.category === "Bundle",
    );
    if (ok) imageSuccess++;
    if ((i + 1) % 25 === 0) {
      console.log(`  ${i + 1}/${products.length} images processed...`);
    }
  }

  console.log(`Images: ${imageSuccess}/${products.length} succeeded`);

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, serializeProducts(products), "utf8");
  console.log(`Wrote ${OUTPUT_FILE} (${products.length} products)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
