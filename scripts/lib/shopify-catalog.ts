export type ShopifyVariant = {
  price: string;
  compare_at_price: string | null;
};

export type ShopifyImage = {
  src: string;
};

export type ShopifyProductJson = {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
};

type ShopifyProductsResponse = {
  products: ShopifyProductJson[];
};

export type NormalizedShopifyProduct = {
  title: string;
  slug: string;
  vendor: string;
  productType: string;
  tags: string[];
  registeredPrice: number;
  imageUrl: string | null;
};

const USER_AGENT = "Mozilla/5.0 (compatible; PluginBargains/1.0)";

export function slugFromHandle(handle: string): string {
  return handle.trim().toLowerCase();
}

export function registeredPriceFromVariants(variants: ShopifyVariant[]): number {
  const variant = variants[0];
  if (!variant) return 0;

  const compare = parsePrice(variant.compare_at_price);
  const price = parsePrice(variant.price);
  const value = compare > 0 ? compare : price;
  return Math.round(value * 100) / 100;
}

function parsePrice(raw: string | null | undefined): number {
  if (!raw) return 0;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 0;
}

export function isBundleProduct(productType: string, tags: string[]): boolean {
  const type = productType.toLowerCase();
  if (
    type.includes("bundle") ||
    type.includes("pick any") ||
    type.includes("subscription")
  ) {
    return true;
  }
  return tags.some((t) => /bundle|pick\s*\d+/i.test(t));
}

export function shouldSkipShopifyProduct(
  product: ShopifyProductJson,
  options?: { skipSubscriptions?: boolean },
): boolean {
  const type = product.product_type.toLowerCase();
  if (options?.skipSubscriptions && type.includes("subscription")) {
    return true;
  }
  if (type.includes("promo") && !type.includes("plug-in")) {
    return true;
  }
  if (
    product.handle === "truefire-courses" ||
    /truefire.*guitar course/i.test(product.title)
  ) {
    return true;
  }
  return false;
}

function cleanShopifyImageSrc(src: string): string {
  return src.replace(/\?.*$/, "");
}

function scorePluginAllianceImageFilename(name: string): number {
  const lower = name.toLowerCase();
  let score = 0;

  if (/productimage-\d+/.test(lower)) score += 28;
  if (/screenshot/.test(lower)) score += 24;
  if (/_gui|gui[_\-.]|\.gui\.|ui\.png|ui\.jpg|interface|plug-?in/i.test(lower)) {
    score += 20;
  }
  if (/mainimage|main2|main\.png|-main\./i.test(lower)) score += 14;
  if (/reformerpro|weaponiser|reference3/i.test(lower)) score += 16;

  if (/screenshot-a|screenshot-main|screenshot-synth/i.test(lower)) score += 10;

  if (/featured|hero|banner|social|lifestyle|collage|og-/i.test(lower)) {
    score -= 40;
  }
  if (
    /portfolio-update|subscription-artwork|website-image|welcome-to|truefire-website/i.test(
      lower,
    )
  ) {
    score -= 35;
  }
  if (/\.jpg$/i.test(lower) && !/gui|screenshot|productimage/i.test(lower)) {
    score -= 8;
  }

  return score;
}

/** Plugin Alliance Shopify: prefer CMS productimage / screenshot GUI assets. */
export function resolvePluginAllianceGuiImage(
  raw: ShopifyProductJson,
): string | null {
  const images = raw.images ?? [];
  if (images.length === 0) return null;

  let best: { src: string; score: number; index: number } | null = null;

  for (let i = 0; i < images.length; i++) {
    const src = cleanShopifyImageSrc(images[i].src);
    const name = src.split("/").pop() ?? "";
    const score = scorePluginAllianceImageFilename(name) - i * 0.01;

    if (!best || score > best.score) {
      best = { src, score, index: i };
    }
  }

  if (!best) return null;
  return upgradeShopifyImageUrl(best.src);
}

function scoreUadImageFilename(name: string, handle: string): number {
  const lower = name.toLowerCase();
  let score = 0;

  if (/explore_free|gallery_1_tec|_tec\.png/i.test(lower)) score -= 90;
  if (/hero|banner|social|lifestyle|featured|testimonial|thumb/i.test(lower)) {
    score -= 55;
  }
  if (/feature_sm/i.test(lower)) score -= 45;
  if (/\.jpg$/i.test(lower)) score -= 35;
  if (/feature_lg/i.test(lower)) score += 18;

  const galleryMatch = lower.match(/gallery_(\d+)/);
  if (galleryMatch) {
    const n = Number.parseInt(galleryMatch[1], 10);
    if (n === 1) score += 32;
    else if (n === 2) score += 12;
    else score -= (n - 2) * 8;
  }

  if (/gallery_1_v2/i.test(lower)) score += 10;

  const handleSnake = handle.replace(/-/g, "_");
  const norm = (value: string) => value.replace(/_+/g, "_");
  if (norm(lower).includes(norm(handleSnake))) score += 25;

  for (const part of handleSnake.split("_")) {
    if (part.length > 3 && lower.includes(part)) score += 3;
  }

  if (handle.includes("polymax") && lower.includes("polymax_synth")) score += 22;
  if (handle.includes("century") && lower.includes("channel_strip")) score += 22;
  if (handle.includes("sound-city") && lower.includes("sound_city_studios")) {
    score += 10;
  }

  if (/\.png$/i.test(lower) && /gallery/i.test(lower)) score += 8;

  return score;
}

/** UAD Shopify: prefer plugin GUI galleries over explore_free / _tec promos. */
export function resolveUadGuiImageUrls(raw: ShopifyProductJson): string[] {
  const images = raw.images ?? [];
  const handle = raw.handle;
  const scored = images.map((img, index) => {
    const src = upgradeShopifyImageUrl(cleanShopifyImageSrc(img.src));
    const name = src.split("/").pop() ?? "";
    return { src, score: scoreUadImageFilename(name, handle) - index * 0.01 };
  });

  scored.sort((a, b) => b.score - a.score);
  return [...new Set(scored.map((entry) => entry.src))];
}

export function resolveUadGuiImage(raw: ShopifyProductJson): string | null {
  return resolveUadGuiImageUrls(raw)[0] ?? null;
}

export function rankUadImageUrls(urls: string[], handle: string): string[] {
  const unique = [...new Set(urls.map((url) => upgradeShopifyImageUrl(url)))];
  return unique.sort((a, b) => {
    const nameA = a.split("/").pop() ?? "";
    const nameB = b.split("/").pop() ?? "";
    return scoreUadImageFilename(nameB, handle) - scoreUadImageFilename(nameA, handle);
  });
}

/** Prefer plugin GUI screenshots over marketing hero / featured images. */
export function resolveShopifyGuiImage(raw: ShopifyProductJson): string | null {
  const images = raw.images ?? [];
  if (images.length === 0) return null;

  const gui = images.find(
    (img) =>
      /image-01|gallery[_-]?1|gallery-1|_gui|interface|screenshot|plug-?in/i.test(
        img.src,
      ) && !/featured|hero|banner|lifestyle|social/i.test(img.src),
  );
  if (gui) return upgradeShopifyImageUrl(cleanShopifyImageSrc(gui.src));

  const nonMarketing = images.find(
    (img) =>
      !/featured-image|featured_image|hero|banner|social|og-|collage/i.test(
        img.src,
      ),
  );
  if (nonMarketing) {
    return upgradeShopifyImageUrl(cleanShopifyImageSrc(nonMarketing.src));
  }

  const first = images[0]?.src;
  return first ? upgradeShopifyImageUrl(cleanShopifyImageSrc(first)) : null;
}

export function normalizeShopifyProduct(
  raw: ShopifyProductJson,
  options?: {
    resolveImage?: (product: ShopifyProductJson) => string | null;
  },
): NormalizedShopifyProduct {
  const resolveImage = options?.resolveImage ?? resolveShopifyGuiImage;
  const imageUrl = resolveImage(raw);

  return {
    title: raw.title.trim(),
    slug: slugFromHandle(raw.handle),
    vendor: raw.vendor.trim(),
    productType: raw.product_type.trim(),
    tags: raw.tags ?? [],
    registeredPrice: registeredPriceFromVariants(raw.variants),
    imageUrl: imageUrl ? upgradeShopifyImageUrl(imageUrl) : null,
  };
}

/** Prefer larger CDN image when URL uses width-limited Shopify paths. */
function upgradeShopifyImageUrl(url: string): string {
  return url
    .replace(/_(?:small|compact|medium|large|grande|master)\./i, ".")
    .replace(/[?&]width=\d+/gi, "");
}

export async function fetchAllShopifyProducts(
  collectionProductsJsonUrl: string,
  options?: { pageLimit?: number; delayMs?: number },
): Promise<ShopifyProductJson[]> {
  const all: ShopifyProductJson[] = [];
  const pageLimit = options?.pageLimit ?? 250;
  const delayMs = options?.delayMs ?? 300;

  for (let page = 1; page <= 50; page++) {
    const separator = collectionProductsJsonUrl.includes("?") ? "&" : "?";
    const url = `${collectionProductsJsonUrl}${separator}limit=${pageLimit}&page=${page}&currency=USD`;

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Shopify fetch failed ${res.status}: ${url}`);
    }

    const data = (await res.json()) as ShopifyProductsResponse;
    const batch = data.products ?? [];
    if (batch.length === 0) break;

    all.push(...batch);
    console.log(`  page ${page}: ${batch.length} products (${all.length} total)`);

    if (batch.length < pageLimit) break;
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return all;
}

export function serializeCatalogProducts(
  products: Array<{
    name: string;
    slug: string;
    canonicalId: string;
    image: string;
    category: string;
    manufacturer: string;
    registeredPrice: number;
    tags: string[];
    retailers: string[];
  }>,
  options: { exportName: string; generatedBy: string },
): string {
  const lines = products.map((p) => {
    const tags = p.tags.map((t) => JSON.stringify(t)).join(", ");
    return `  {
    name: ${JSON.stringify(p.name)},
    slug: ${JSON.stringify(p.slug)},
    canonicalId: ${JSON.stringify(p.canonicalId)},
    image: ${JSON.stringify(p.image)},
    category: ${JSON.stringify(p.category)},
    manufacturer: ${JSON.stringify(p.manufacturer)},
    registeredPrice: ${p.registeredPrice},
    tags: [${tags}],
    retailers: [${p.retailers.map((r) => JSON.stringify(r)).join(", ")}],
  }`;
  });

  return `/** Generated by ${options.generatedBy} — do not edit manually. */
import type { SeedProduct } from "@/lib/catalog/seed-product";

export const ${options.exportName}: SeedProduct[] = [
${lines.join(",\n")}
];
`;
}
