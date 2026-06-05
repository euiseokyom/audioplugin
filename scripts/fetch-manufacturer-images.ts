/**
 * Downloads Soundtoys product images from soundtoys.com (official source).
 * Other manufacturers use their build:*-catalog scripts.
 *
 * Run: npm run fetch:manufacturer-images
 */

import {
  downloadImage,
  processProductImageFromBuffer,
  processProductImageFromUrls,
} from "./lib/process-product-image";
import {
  fetchPageHtml,
  resolveOgImage,
} from "./lib/page-scrape";

const SOUNDTOYS_BASE = "https://www.soundtoys.com";

const SOUNDTOYS_SLUG_OVERRIDES: Record<string, string> = {};

const SOUNDTOYS_IMAGE_OVERRIDES: Record<string, string> = {
  "soundtoys-5":
    "https://www.soundtoys.com/wp-content/uploads/ST5_Box_Standard_Left_2017.png",
};

const PANEL_DETAIL_IMAGE = /_(Right|Left)(-|\.)/i;
const CROPPED_DETAIL_IMAGE =
  /cropped|shape-?tweak|gate\.png|dynamics\.png|-tweak-/i;

const SOUNDTOYS_SLUGS = [
  "soundtoys-5",
  "effect-rack",
  "decapitator",
  "echoboy",
  "sie-q",
  "devil-loc-deluxe",
  "microshift",
  "crystallizer",
  "phasemistress",
  "tremolator",
  "filterfreak",
  "primaltap",
  "radiator",
  "superplate",
  "little-alterboy",
  "panman",
  "spaceblender",
] as const;

function getSoundtoysProductUrl(slug: string): string {
  const segment = SOUNDTOYS_SLUG_OVERRIDES[slug] ?? slug;
  return `${SOUNDTOYS_BASE}/product/${segment}/`;
}

const GENERIC_OG_PATTERNS = [
  /PREVIEW-IMAGE/i,
  /homepage_hero/i,
  /Plug-in-Collage/i,
  /fb_1200x628/i,
  /fb_og/i,
];

function isGenericOgImage(url: string): boolean {
  return GENERIC_OG_PATTERNS.some((pattern) => pattern.test(url));
}

function slugKeywords(slug: string): string[] {
  const base = slug.replace(/-/g, " ");
  const parts = slug.split("-").filter((p) => p.length > 2);
  return [slug.replace(/-/g, ""), base, ...parts];
}

function resolveFallbackImage(
  html: string,
  pageUrl: string,
  slug: string,
): string | null {
  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)];
  const keywords = slugKeywords(slug);
  let best: { url: string; score: number } | null = null;

  for (const match of imgMatches) {
    const src = match[1];
    if (!src || src.startsWith("data:")) continue;
    const lower = src.toLowerCase();
    if (
      lower.includes("logo") ||
      lower.includes("icon") ||
      lower.includes("-400x") ||
      lower.includes("collage")
    ) {
      continue;
    }

    if (!lower.includes("soundtoys.com")) continue;

    const absolute = new URL(src.replace(/&amp;/g, "&"), pageUrl).href;
    let score = 0;
    if (/soundtoys_5\.5_/i.test(lower)) score += 8;
    if (/complexpedalpattern|style-tweak|bionicpulse|massivecrunch/i.test(lower))
      score += 6;
    if (/-\d{3,4}x\d{3,4}\./i.test(lower)) score += 4;
    if (/fb_1200x628/i.test(lower)) score -= 6;
    if (PANEL_DETAIL_IMAGE.test(src)) score -= 12;
    if (CROPPED_DETAIL_IMAGE.test(lower)) score -= 8;

    for (const keyword of keywords) {
      if (lower.includes(keyword.replace(/-/g, ""))) score += 4;
    }

    if (!best || score > best.score) {
      best = { url: absolute, score };
    }
  }

  return best?.score && best.score > 0 ? best.url : null;
}

async function resolveImageUrl(
  slug: string,
  pageUrl: string,
): Promise<string | null> {
  const html = await fetchPageHtml(pageUrl);
  if (!html) return null;

  const og = resolveOgImage(html, pageUrl);
  if (og && !isGenericOgImage(og)) return og;

  return resolveFallbackImage(html, pageUrl, slug);
}

async function processSlug(slug: string, pageUrl: string): Promise<boolean> {
  console.log(`Processing ${slug}…`);

  const overrideUrl = SOUNDTOYS_IMAGE_OVERRIDES[slug];
  if (overrideUrl) {
    const buffer = await downloadImage(overrideUrl);
    if (buffer) {
      await processProductImageFromBuffer(slug, buffer);
      console.log(`  ✓ ${slug} ← ${overrideUrl}`);
      return true;
    }
  }

  const imageUrl = await resolveImageUrl(slug, pageUrl);
  if (!imageUrl) {
    console.warn(`  ✗ No image URL on ${pageUrl}`);
    return false;
  }

  const buffer = await downloadImage(imageUrl);
  if (buffer) {
    await processProductImageFromBuffer(slug, buffer);
    console.log(`  ✓ ${slug} ← ${imageUrl}`);
    return true;
  }

  return processProductImageFromUrls(slug, [imageUrl]);
}

async function main(): Promise<void> {
  let ok = 0;
  let failed = 0;

  for (const slug of SOUNDTOYS_SLUGS) {
    if (await processSlug(slug, getSoundtoysProductUrl(slug))) {
      ok++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone: ${ok} succeeded, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
