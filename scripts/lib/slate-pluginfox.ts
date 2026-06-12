/**
 * Slate Digital product images from PluginFox (Shopify) — GUI screenshots
 * when slatedigital.com lacks usable assets.
 */

import type { ShopifyProductJson } from "./shopify-catalog";

const PLUGINFOX_BASE = "https://pluginfox.com";
const PLUGINFOX_SLATE_COLLECTION =
  "https://pluginfox.com/collections/slate-digital/products.json";

/** Catalog slug → PluginFox product handle (manual overrides). */
export const SLATE_PLUGINFOX_HANDLES: Record<string, string> = {
  "bus-clipper": "slate-digital-bus-clipper",
  "chorus-d-bundle-plugin": "slate-digital-chorus-d-bundle",
  "custom-opto": "slate-digital-custom-opto",
  "custom-series-bundle": "slate-digital-custom-series",
  "eiosis-air-and-earth-eq": "eiosis-air-earth-eq",
  "eiosis-aireq": "eiosis-aireq-premium",
  "eiosis-e2deesser-deesser-plugin": "eiosis-e2-deesser",
  "fg-116-blue-series-fet-compressors": "slate-digital-fg116-blue-series",
  "fg-2a-compressor-plugin": "slate-digital-fg2a",
  "fg-36a": "slate-digital-fg36a",
  "fg-a": "slate-digital-fga",
  "fg-bomber": "slate-digital-fg-bomber",
  "fg-ds-902": "slate-digital-fgds",
  "fg-dynamics": "slate-digital-fg-dynamics",
  "fg-stress-distressor-plugin": "slate-digital-fg-stress",
  "fg-x-2-mastering-plugin": "slate-digital-fgx2",
  "gates-bundle": "slate-gates-bundle",
  "infinity-bass-plugin": "slate-digital-infinity-bass",
  "infinity-eq": "slate-digital-infinity-eq",
  "infinity-horizon": "slate-digital-infinity-horizon",
  "metapitch-pitch-shifting-plugin": "slate-digital-metapitch",
  metatune: "slate-digital-metatune",
  "mix-bundle-one": "slate-digital-vmr",
  "mo-tt-ott-plugin-multiband-compressor": "slate-digital-mo-tt",
  "murda-melodies": "slate-digital-murda-melodies",
  "rotary-sd-147": "slate-digital-rotary-sd-147",
  "sd-3a-compressor-plugin": "slate-digital-sd3a",
  "sd-pe1-passive-eq-plugin": "slate-digital-sd-pe1",
  "stellar-echo-sd-201": "slate-digital-stellar-echo-sd-201",
  "storch-filter": "slate-digital-storch-filter",
  "submerge-sidechain-compressor-plugin": "slate-digital-submerge",
  "transient-shaper-plugin": "slate-digital-transient-shaper",
  "verbsuite-classics": "slate-verbsuite-classics",
  "virtual-buss-compressors": "slate-digital-vbc",
  "virtual-console-collection": "slate-digital-vcc",
  "virtual-preamp-collection": "slate-digital-vpc",
  "virtual-tape-machines": "slate-digital-vtm",
  "virtual-tube-collection": "slate-digital-vtc",
};

/** Prefer a specific asset when a PluginFox product has multiple GUIs. */
const SLUG_IMAGE_PREFER: Record<string, RegExp> = {
  "mix-bundle-one": /mixbundleone/i,
};

function scorePluginFoxSlateGuiFilename(
  name: string,
  catalogSlug?: string,
): number {
  const lower = name.toLowerCase();
  let score = 0;

  if (catalogSlug && SLUG_IMAGE_PREFER[catalogSlug]?.test(lower)) score += 40;
  if (/gui1\.|gui1_|-gui1/i.test(lower)) score += 32;
  if (/guis[_\-.]|bundleguis|collectionguis/i.test(lower)) score += 28;
  if (/advancedgui|easymode/i.test(lower)) score += 22;
  if (/\bgui\b/i.test(lower)) score += 18;
  if (/verbsuite/i.test(lower)) score += 12;
  if (/rack/i.test(lower)) score -= 18;
  if (/hero|banner|featured|lifestyle|art\.jpg/i.test(lower)) score -= 30;
  if (/\.jpg$/i.test(lower) && /gui/i.test(lower)) score += 6;

  return score;
}

export function resolvePluginFoxSlateGuiImage(
  product: ShopifyProductJson,
  catalogSlug?: string,
): string | null {
  const images = product.images ?? [];
  if (images.length === 0) return null;

  let best: { src: string; score: number } | null = null;

  for (const img of images) {
    const src = img.src.replace(/\?.*$/, "");
    const name = src.split("/").pop() ?? "";
    const score = scorePluginFoxSlateGuiFilename(name, catalogSlug);
    if (!best || score > best.score) {
      best = { src, score };
    }
  }

  if (best && best.score >= 8) return best.src;

  const fallback = images[0]?.src?.replace(/\?.*$/, "");
  return fallback ?? null;
}

export async function fetchPluginFoxProduct(
  handle: string,
): Promise<ShopifyProductJson | null> {
  const res = await fetch(`${PLUGINFOX_BASE}/products/${handle}.json`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PluginBargains/1.0)" },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { product?: ShopifyProductJson };
  return data.product ?? null;
}

export async function fetchPluginFoxSlateCollection(): Promise<
  ShopifyProductJson[]
> {
  const res = await fetch(`${PLUGINFOX_SLATE_COLLECTION}?limit=250`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; PluginBargains/1.0)" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { products?: ShopifyProductJson[] };
  return data.products ?? [];
}

export async function resolveSlatePluginFoxImageUrl(
  catalogSlug: string,
): Promise<string | null> {
  const handle = SLATE_PLUGINFOX_HANDLES[catalogSlug];
  if (!handle) return null;

  const product = await fetchPluginFoxProduct(handle);
  if (!product) return null;

  return resolvePluginFoxSlateGuiImage(product, catalogSlug);
}

export function listUnmappedSlateCatalogSlugs(
  catalogSlugs: string[],
): string[] {
  return catalogSlugs.filter(
    (slug) => !SLATE_PLUGINFOX_HANDLES[slug] && slug !== "audified-u73b",
  );
}
