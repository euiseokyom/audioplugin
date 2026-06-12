/**
 * Crawls xlnaudio.com core products and generates lib/catalog/xln-products.ts.
 *
 * Run: npm run build:xln-catalog
 */

import {
  buildCatalogFile,
  enrichFromProductPage,
  type CatalogSourceItem,
} from "./lib/official-catalog";
import { fetchPageHtml } from "./lib/page-scrape";
import {
  fetchPluginFoxProduct,
  resolveXlnPluginFoxImageUrl,
  XLN_PLUGINFOX_HANDLES,
} from "./lib/xln-pluginfox";
import { isBundleNameOrSlug } from "../lib/catalog/catalog-category-map";
import { DEFAULT_RETAILERS } from "../lib/catalog/manufacturer-retailers";
import { registeredPriceFromVariants } from "./lib/shopify-catalog";

const MANUFACTURER = "XLN Audio";
const MANUFACTURER_TAG = "xln-audio";
const BASE = "https://www.xlnaudio.com";

type XlnCatalogProduct = {
  slug: string;
  name: string;
  pageUrl: string;
  isBundle?: boolean;
  categoryHint?: string;
};

/** Individually sold core products (not ADpaks / expansions / AD2). */
const XLN_CATALOG_PRODUCTS: XlnCatalogProduct[] = [
  {
    slug: "addictive-trigger",
    name: "Addictive Trigger",
    pageUrl: `${BASE}/products/addictive_trigger`,
  },
  {
    slug: "db-30-drum-butter",
    name: "DB-30 Drum Butter",
    pageUrl: `${BASE}/products/addictive_fx/effect/db-30_drum_butter`,
  },
  {
    slug: "ds-10-drum-shaper",
    name: "DS-10 Drum Shaper",
    pageUrl: `${BASE}/products/addictive_fx/effect/ds-10_drum_shaper`,
  },
  {
    slug: "life",
    name: "Life",
    pageUrl: `${BASE}/products/life`,
  },
  {
    slug: "rc-20-retro-color",
    name: "RC-20 Retro Color",
    pageUrl: `${BASE}/products/addictive_fx/effect/rc-20_retro_color`,
  },
  {
    slug: "xo",
    name: "XO",
    pageUrl: `${BASE}/products/xo`,
  },
  {
    slug: "addictive-keys-duo-bundle",
    name: "Addictive Keys Duo Bundle",
    pageUrl: `${BASE}/products/addictive_keys/bundles/duo_bundle`,
    isBundle: true,
  },
  {
    slug: "addictive-keys-trio-bundle",
    name: "Addictive Keys Trio Bundle",
    pageUrl: `${BASE}/products/addictive_keys/bundles/trio_bundle`,
    isBundle: true,
  },
  {
    slug: "addictive-keys-modern-upright",
    name: "Addictive Keys Modern Upright",
    pageUrl: `${BASE}/products/addictive_keys/instrument/modern_upright`,
    categoryHint: "Instrument",
  },
  {
    slug: "addictive-keys-mark-one",
    name: "Addictive Keys Mark One",
    pageUrl: `${BASE}/products/addictive_keys/instrument/mark_one`,
    categoryHint: "Instrument",
  },
  {
    slug: "addictive-keys-studio-grand",
    name: "Addictive Keys Studio Grand",
    pageUrl: `${BASE}/products/addictive_keys/instrument/studio_grand`,
    categoryHint: "Instrument",
  },
  {
    slug: "addictive-keys-electric-grand",
    name: "Addictive Keys Electric Grand",
    pageUrl: `${BASE}/products/addictive_keys/instrument/electric_grand`,
    categoryHint: "Instrument",
  },
];

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

async function pluginFoxRegisteredPrice(slug: string): Promise<number | undefined> {
  const handle = XLN_PLUGINFOX_HANDLES[slug];
  if (!handle) return undefined;
  const product = await fetchPluginFoxProduct(handle);
  if (!product?.variants?.length) return undefined;
  const price = registeredPriceFromVariants(product.variants);
  return price > 0 ? price : undefined;
}

async function main() {
  console.log(`Building ${XLN_CATALOG_PRODUCTS.length} XLN Audio products...`);

  const items: CatalogSourceItem[] = [];

  for (const product of XLN_CATALOG_PRODUCTS) {
    const enriched = await enrichFromProductPage({
      name: product.name,
      slug: product.slug,
      pageUrl: product.pageUrl,
      categoryHint: product.categoryHint,
      isBundle: product.isBundle,
    });

    const html = await fetchPageHtml(product.pageUrl);
    let imageUrl = await resolveXlnPluginFoxImageUrl(product.slug);
    if (!imageUrl) {
      imageUrl =
        enriched.imageUrl ?? (html ? resolveXlnImage(html, product.slug) : null);
    }

    const registeredPrice =
      enriched.registeredPrice && enriched.registeredPrice > 0
        ? enriched.registeredPrice
        : (await pluginFoxRegisteredPrice(product.slug)) ?? 0;

    items.push({
      ...enriched,
      name: product.name,
      imageUrl,
      registeredPrice,
      isBundle:
        product.isBundle ?? isBundleNameOrSlug(enriched.name, product.slug),
      categoryHint: product.categoryHint,
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
    retailers: [...DEFAULT_RETAILERS],
    delayMs: 0,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
