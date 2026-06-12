/**
 * XLN Audio product images from PluginFox (Shopify) — GUI screenshots.
 */

import type { ShopifyProductJson } from "./shopify-catalog";
import { fetchPluginFoxProduct } from "./slate-pluginfox";

export { fetchPluginFoxProduct };

/** Catalog slug → PluginFox product handle. */
export const XLN_PLUGINFOX_HANDLES: Record<string, string> = {
  "addictive-trigger": "xln-addictive-trigger",
  "addictive-keys-duo-bundle": "xln-audio-addictive-keys-duo-bundle",
  "addictive-keys-trio-bundle": "xln-addictive-keys-trio-bundle",
  "addictive-keys-modern-upright": "xln-addictive-keys-modern-upright",
  "addictive-keys-mark-one": "xln-audio-addictive-keys-mark-one",
  "addictive-keys-studio-grand": "xln-addictive-keys-studio-grand",
  "addictive-keys-electric-grand": "xln-addictive-keys-electric-grand",
  "db-30-drum-butter": "xln-audio-db30-drum-butter",
  "ds-10-drum-shaper": "xln-ds10-drum-shaper",
  life: "xln-audio-life",
  "rc-20-retro-color": "xln-rc20-retro-color",
  xo: "xln-audio-xo",
};

/** Prefer a specific asset when a PluginFox product has multiple images. */
const SLUG_IMAGE_PREFER: Record<string, RegExp> = {
  "addictive-keys-modern-upright": /ak_mod_upright\.png/i,
  "addictive-keys-mark-one": /ak_mk1\.png/i,
  "addictive-keys-studio-grand": /ak_studio_grand\.png/i,
  "addictive-keys-electric-grand": /ak_electric_grand\.png/i,
  "addictive-trigger": /addictivetriggergui/i,
  life: /lifegui1/i,
};

function scorePluginFoxXlnGuiFilename(
  name: string,
  catalogSlug?: string,
): number {
  const lower = name.toLowerCase();
  let score = 0;

  if (catalogSlug && SLUG_IMAGE_PREFER[catalogSlug]?.test(lower)) score += 40;
  if (/gui\d|_gui|gui\d+\./i.test(lower)) score += 32;
  if (/rc20|ds10|xolite|drum_butter/i.test(lower)) score += 20;
  if (/ak_(mod_upright|mk1|studio_grand|electric_grand)\.png/i.test(lower)) {
    score += 24;
  }
  if (/duo_bundle|trio_bundle/i.test(lower)) score += 20;
  if (/\.png$/i.test(lower)) score += 6;

  if (/art\.jpg|box\.png|_fx\.|_edit\./i.test(lower)) score -= 30;
  if (/adpak|collectionart|hero|banner|featured|lifestyle/i.test(lower)) {
    score -= 35;
  }

  return score;
}

export function resolvePluginFoxXlnGuiImage(
  product: ShopifyProductJson,
  catalogSlug?: string,
): string | null {
  const images = product.images ?? [];
  if (images.length === 0) return null;

  let best: { src: string; score: number } | null = null;

  for (const img of images) {
    const src = img.src.replace(/\?.*$/, "");
    const name = src.split("/").pop() ?? "";
    const score = scorePluginFoxXlnGuiFilename(name, catalogSlug);
    if (!best || score > best.score) {
      best = { src, score };
    }
  }

  if (best && best.score >= 8) return best.src;

  const fallback = images[0]?.src?.replace(/\?.*$/, "");
  return fallback ?? null;
}

export async function resolveXlnPluginFoxImageUrl(
  catalogSlug: string,
): Promise<string | null> {
  const handle = XLN_PLUGINFOX_HANDLES[catalogSlug];
  if (!handle) return null;

  const product = await fetchPluginFoxProduct(handle);
  if (!product) return null;

  return resolvePluginFoxXlnGuiImage(product, catalogSlug);
}

export function listUnmappedXlnCatalogSlugs(catalogSlugs: string[]): string[] {
  return catalogSlugs.filter((slug) => !XLN_PLUGINFOX_HANDLES[slug]);
}
