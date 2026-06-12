/**
 * AudioDeluxe (Shopify) product lookup for manufacturer catalog images.
 * Bulk-loads the catalog via products.json to avoid search rate limits.
 * Uses full-size product gallery images, not search-grid thumbnails.
 */

import {
  resolveShopifyGuiImage,
  type ShopifyProductJson,
} from "./shopify-catalog";

const AUDIO_DELUXE_BASE = "https://audiodeluxe.com";
const USER_AGENT = "Mozilla/5.0 (compatible; PluginBargains/1.0)";

let cachedMcDSPProducts: ShopifyProductJson[] | null = null;
let cachedAntaresProducts: ShopifyProductJson[] | null = null;

const ANTARES_SLUG_TO_HANDLE: Record<string, string> = {
  "auto-key": "antares-auto-key-2",
  at2026: "antares-autotune-2026",
  "efx-plus": "antares-auto-tune-efx-10",
  pro: "antares-auto-tune-pro-11",
  hybrid: "antares-auto-tune-hybrid",
  vocodist: "antares-auto-tune-vocodist-perpetual-license",
  "vocal-compressor": "antares-auto-tune-vocal-compressor-perpetual-license",
  "vocal-eq": "antares-auto-tune-vocal-eq-perpetual-license",
  "creative-vocal-effects-metamorph": "antares-metamorph",
  "creative-vocal-effects-mic-mod": "antares-mic-mod-efx",
  "creative-vocal-effects-warm": "antares-warm",
  "creative-vocal-effects-vocal-de-esser": "antares-vocal-de-esser",
  "creative-vocal-effects-vocal-reverb": "antares-vocal-reverb",
  "creative-vocal-effects-vocodist":
    "antares-auto-tune-vocodist-perpetual-license",
  "ai-powered-vocal-chain-vocal-compressor":
    "antares-auto-tune-vocal-compressor-perpetual-license",
  "ai-powered-vocal-chain-vocal-eq":
    "antares-auto-tune-vocal-eq-perpetual-license",
  "ai-powered-vocal-chain-vocal-de-esser": "antares-vocal-de-esser",
  "ai-powered-vocal-chain-vocal-prep": "antares-vocal-prep",
  "ai-powered-vocal-chain-vocal-reverb": "antares-vocal-reverb",
  "vocal-de-esser": "antares-vocal-de-esser",
  "vocal-reverb": "antares-vocal-reverb",
};

function upgradeAntaresShopifyImageUrl(url: string): string {
  return url
    .replace(/_(?:small|compact|medium|large|grande|master)\./i, ".")
    .replace(/[?&]width=\d+/gi, "");
}

function isAntaresLifestyleImage(src: string): boolean {
  return /macbook|laptop|apple_mac|on_an_apple|view_of_auto-tune/i.test(src);
}

/** Prefer GUI screenshots; reject AudioDeluxe lifestyle/macbook shots. */
export function resolveAntaresShopifyGuiImage(
  product: ShopifyProductJson,
): string | null {
  const images = product.images ?? [];
  if (images.length === 0) return null;

  const ranked = images
    .filter((img) => !isAntaresLifestyleImage(img.src))
    .map((img) => {
      const src = img.src.toLowerCase();
      let score = 0;
      if (
        /default_classic|default_modern|vocal_eq_default|fet_single|lite_-_default/i.test(
          src,
        )
      ) {
        score += 20;
      }
      if (/plug-?in|interface|screenshot|_gui|image-01/i.test(src)) score += 8;
      if (/featured|hero|banner|lifestyle|collage|in_action|light_mode/i.test(src)) {
        score -= 12;
      }
      if (/transforming|honeyed|avatar|voice.model|update_available/i.test(src)) {
        score -= 20;
      }
      if (/main-ui|plugin_interface|default_classic|default_modern/i.test(src)) {
        score += 12;
      }
      if (/\.webp|\.png|\.jpg/i.test(src)) score += 2;
      return { src: img.src, score };
    })
    .sort((a, b) => b.score - a.score);

  if (ranked[0]?.score > 0) {
    return upgradeAntaresShopifyImageUrl(ranked[0].src);
  }

  const fallback = images.find((img) => !isAntaresLifestyleImage(img.src));
  if (fallback) return upgradeAntaresShopifyImageUrl(fallback.src);

  return resolveShopifyGuiImage(product);
}

function resolveAntaresHandle(catalogSlug: string): string | null {
  if (ANTARES_SLUG_TO_HANDLE[catalogSlug]) {
    return ANTARES_SLUG_TO_HANDLE[catalogSlug];
  }

  const evoMatch = catalogSlug.match(/^creative-vocal-effects-(.+)$/);
  if (evoMatch) {
    const leaf = evoMatch[1];
    if (leaf === "slice") return null;
    return `antares-${leaf}-evo`;
  }

  return null;
}

function slugParts(slug: string): string[] {
  return slug
    .split("-")
    .filter((part) => part.length > 1 || /^\d+$/.test(part));
}

function handleMatchesSlug(handle: string, catalogSlug: string): boolean {
  const h = handle.toLowerCase();

  if (catalogSlug === "live-pack-ii-bundle") {
    return h.includes("live-pack") || h.replace(/-/g, "").includes("livepack");
  }

  if (catalogSlug === "futzverb") {
    return h === "mcdsp-futzverb" || h.includes("futzverb");
  }

  const flat = h.replace(/-/g, "");
  return slugParts(catalogSlug).every((part) =>
    flat.includes(part.replace(/-/g, "")),
  );
}

function scoreMcDSPHandle(handle: string, catalogSlug: string): number {
  const h = handle.toLowerCase();
  if (!handleMatchesSlug(h, catalogSlug)) return -1;

  const isPack = /pack|bundle/.test(catalogSlug);
  if (!isPack && /pack|bundle/.test(h)) return -1;

  let score = 10;
  for (const part of slugParts(catalogSlug)) {
    if (h.includes(part)) score += 3;
  }
  if (h.includes("native")) score += 3;
  if (/v7|v62/.test(h)) score += 2;
  if (h.includes("-hd-")) score -= 2;
  return score;
}

export async function fetchAllAudioDeluxeMcDSPProducts(): Promise<
  ShopifyProductJson[]
> {
  if (cachedMcDSPProducts) return cachedMcDSPProducts;

  const all: ShopifyProductJson[] = [];

  for (let page = 1; page <= 30; page++) {
    const url = `${AUDIO_DELUXE_BASE}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`AudioDeluxe products.json failed ${res.status}`);
    }

    const data = (await res.json()) as { products?: ShopifyProductJson[] };
    const batch = data.products ?? [];
    if (batch.length === 0) break;

    for (const product of batch) {
      if (/^mcdsp-/i.test(product.handle)) {
        all.push(product);
      }
    }

    if (batch.length < 250) break;
    await new Promise((r) => setTimeout(r, 600));
  }

  cachedMcDSPProducts = all;
  return all;
}

export function matchAudioDeluxeMcDSPProduct(
  products: ShopifyProductJson[],
  slug: string,
): ShopifyProductJson | null {
  let best: { product: ShopifyProductJson; score: number } | null = null;

  for (const product of products) {
    const score = scoreMcDSPHandle(product.handle, slug);
    if (score < 0) continue;
    if (!best || score > best.score) {
      best = { product, score };
    }
  }

  return best?.product ?? null;
}

export async function resolveAudioDeluxeMcDSPImage(
  slug: string,
): Promise<{ imageUrl: string | null; productPath: string | null }> {
  const products = await fetchAllAudioDeluxeMcDSPProducts();
  const product = matchAudioDeluxeMcDSPProduct(products, slug);

  if (!product) {
    return { imageUrl: null, productPath: null };
  }

  return {
    imageUrl: resolveShopifyGuiImage(product),
    productPath: `/products/${product.handle}`,
  };
}

export async function fetchAllAudioDeluxeAntaresProducts(): Promise<
  ShopifyProductJson[]
> {
  if (cachedAntaresProducts) return cachedAntaresProducts;

  const all: ShopifyProductJson[] = [];

  for (let page = 1; page <= 30; page++) {
    const url = `${AUDIO_DELUXE_BASE}/products.json?limit=250&page=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`AudioDeluxe products.json failed ${res.status}`);
    }

    const data = (await res.json()) as { products?: ShopifyProductJson[] };
    const batch = data.products ?? [];
    if (batch.length === 0) break;

    for (const product of batch) {
      if ((product.vendor ?? "").toLowerCase() === "antares") {
        all.push(product);
      }
    }

    if (batch.length < 250) break;
    await new Promise((r) => setTimeout(r, 600));
  }

  cachedAntaresProducts = all;
  return all;
}

export function matchAudioDeluxeAntaresProduct(
  products: ShopifyProductJson[],
  slug: string,
): ShopifyProductJson | null {
  const handle = resolveAntaresHandle(slug);
  if (!handle) return null;

  return products.find((product) => product.handle === handle) ?? null;
}

export async function resolveAudioDeluxeAntaresImage(
  slug: string,
): Promise<{ imageUrl: string | null; productPath: string | null }> {
  const products = await fetchAllAudioDeluxeAntaresProducts();
  const product = matchAudioDeluxeAntaresProduct(products, slug);

  if (!product) {
    return { imageUrl: null, productPath: null };
  }

  return {
    imageUrl: resolveShopifyGuiImage(product),
    productPath: `/products/${product.handle}`,
  };
}
