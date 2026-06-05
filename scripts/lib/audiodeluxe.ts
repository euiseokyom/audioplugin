/**
 * AudioDeluxe (Shopify) product lookup for McDSP images.
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
