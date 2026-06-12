import { formatProductName } from "../../lib/catalog/product-name";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

export async function fetchPageHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) {
      console.warn(`  ✗ HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.text();
  } catch (error) {
    console.warn(`  ✗ Fetch failed for ${url}:`, error);
    return null;
  }
}

export function resolveOgImage(html: string, pageUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return new URL(match[1].replace(/&amp;/g, "&"), pageUrl).href;
    }
  }

  return null;
}

export function parsePriceFromHtml(html: string): number | null {
  const patterns = [
    /["']price["']\s*:\s*(\d+(?:\.\d+)?)/i,
    /\$(\d+(?:\.\d{2})?)\s*(?:USD|usd)?/,
    /data-price=["'](\d+(?:\.\d+)?)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = Number.parseFloat(match[1]);
      if (Number.isFinite(value) && value >= 0) return Math.round(value * 100) / 100;
    }
  }

  return null;
}

function isMcdspImageNoise(lower: string): boolean {
  return (
    !lower.includes("mcdsp.com") ||
    lower.includes("logo") ||
    lower.includes("typeonly") ||
    lower.includes("cart") ||
    lower.includes("hamburger") ||
    lower.includes("thumbnail_new") ||
    lower.includes("play_button") ||
    lower.includes("pause_button") ||
    lower.includes("button_audio") ||
    lower.includes("artist") ||
    lower.includes("subscription") ||
    /-\d+x\d+\./.test(lower) ||
    /engineer|rodd|pensado|bobhorn|davepensado/i.test(lower)
  );
}

function collectMcdspUploadUrls(html: string, pageUrl: string): string[] {
  const fromUploads = [
    ...html.matchAll(/https:\/\/mcdsp\.com\/wp-content\/uploads\/[^"'\s)]+/gi),
  ].map((match) => match[0].replace(/&amp;/g, "&"));

  const fromImgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => {
      try {
        return new URL(match[1].replace(/&amp;/g, "&"), pageUrl).href;
      } catch {
        return null;
      }
    })
    .filter(
      (url): url is string =>
        url !== null && url.includes("mcdsp.com/wp-content/uploads"),
    );

  return [...new Set([...fromUploads, ...fromImgs])];
}

function scoreMcdspGuiUrl(url: string, slug: string): number {
  const lower = url.toLowerCase();
  if (isMcdspImageNoise(lower)) return -1;

  const keywords = slug
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 2);

  let score = 0;
  if (/_feature_phone/i.test(lower)) score += 20;
  else if (/fullsize\.png/i.test(lower)) score += 18;
  else if (/_feature_reupload/i.test(lower)) score += 12;
  else if (/_app1/i.test(lower)) score += 8;
  else if (/_app2/i.test(lower)) score += 6;
  else if (/_app3/i.test(lower)) score += 5;
  else if (/_feature/i.test(lower)) score += 3;

  if (/featuresection/i.test(lower)) score -= 20;
  if (/videothumb/i.test(lower)) score -= 15;
  if (/thumbnail/i.test(lower)) score -= 15;

  for (const keyword of keywords) {
    if (lower.includes(keyword.replace(/-/g, ""))) score += 2;
  }

  return score;
}

function resolveMcdspBundleImage(html: string, slug: string): string | null {
  const uploadMatches = collectMcdspUploadUrls(html, "https://mcdsp.com/");

  let best: { url: string; score: number } | null = null;
  for (const url of uploadMatches) {
    const lower = url.toLowerCase();
    if (isMcdspImageNoise(lower)) continue;

    let score = 0;
    if (/bundles-glamour/i.test(lower)) score += 14;
    if (/packv7_glamor2\.(jpe?g|png)/i.test(lower)) score += 12;
    if (/glamor/i.test(lower)) score += 8;

    for (const part of slugParts(slug)) {
      if (lower.includes(part.replace(/-/g, ""))) score += 2;
    }

    if (!best || score > best.score) {
      best = { url, score };
    }
  }

  return best?.score && best.score >= 6 ? best.url : null;
}

function slugParts(slug: string): string[] {
  return slug
    .split("-")
    .filter((part) => part.length > 1 || /^\d+$/.test(part));
}

function resolveMcdspGuiImage(
  html: string,
  pageUrl: string,
  slug: string,
): string | null {
  const urls = collectMcdspUploadUrls(html, pageUrl);
  let best: { url: string; score: number } | null = null;

  for (const url of urls) {
    const score = scoreMcdspGuiUrl(url, slug);
    if (score < 8) continue;
    if (!best || score > best.score) {
      best = { url, score };
    }
  }

  return best?.url ?? null;
}

export function resolveMcdspProductImage(
  html: string,
  pageUrl: string,
  slug: string,
  options?: { isBundle?: boolean },
): string | null {
  if (options?.isBundle) {
    return resolveMcdspBundleImage(html, slug);
  }

  const gui = resolveMcdspGuiImage(html, pageUrl, slug);
  if (gui) return gui;

  const og = resolveOgImage(html, pageUrl);
  if (og && !/logo|cart|hamburger|play_|pause_|button|typeonly/i.test(og)) {
    return og;
  }

  return null;
}

export function normalizeMcdspProductName(name: string): string {
  return name.replace(/\s*\|\s*McDSP.*$/i, "").trim();
}

export function parseTitleFromHtml(html: string): string | null {
  const og = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (og?.[1]) {
    const value = og[1].replace(/\s*\|.*$/, "").trim();
    if (value.length > 2) return value;
  }

  const docTitle = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (docTitle?.[1]) {
    const value = docTitle[1].replace(/\s*\|.*$/, "").trim();
    if (value.length > 2) return value;
  }

  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1?.[1]) {
    const value = h1[1].trim();
    if (value.length > 2 && !/^fabfilter$/i.test(value)) return value;
  }

  return null;
}

export function parseMetaProductPrice(html: string): {
  amount: number;
  currency: string;
} | null {
  const amountMatch =
    html.match(
      /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:amount["']/i,
    ) ??
    html.match(/<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(
      /<div[^>]+property=["']schema:price["'][^>]+content=["']([^"']+)["']/i,
    );

  const currencyMatch =
    html.match(
      /<meta[^>]+property=["']product:price:currency["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(
      /<meta[^>]+property=["']product:pretax_price:currency["'][^>]+content=["']([^"']+)["']/i,
    ) ??
    html.match(/<meta[^>]+itemprop=["']priceCurrency["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(
      /<div[^>]+property=["']schema:priceCurrency["'][^>]+content=["']([^"']+)["']/i,
    );

  if (!amountMatch?.[1]) return null;

  const amount = Number.parseFloat(amountMatch[1]);
  if (!Number.isFinite(amount)) return null;

  return {
    amount: Math.round(amount * 100) / 100,
    currency: (currencyMatch?.[1] ?? "USD").toUpperCase(),
  };
}

export function registeredPriceUsd(
  amount: number,
  currency: string,
): number {
  const code = currency.toUpperCase();
  if (code === "USD") return Math.round(amount * 100) / 100;
  if (code === "EUR") return Math.round(amount * 1.09 * 100) / 100;
  if (code === "GBP") return Math.round(amount * 1.27 * 100) / 100;
  if (code === "KRW") return Math.round(amount * 0.00073 * 100) / 100;
  return Math.round(amount * 100) / 100;
}

export function normalizeFabFilterProductName(name: string): string {
  const withoutPlugin = name.replace(/\s+plug-?in\s*$/i, "").trim();
  const dash = withoutPlugin.indexOf(" - ");
  if (dash > 0 && /^fabfilter\b/i.test(withoutPlugin)) {
    return withoutPlugin.slice(0, dash).trim();
  }
  return withoutPlugin;
}

export function normalizeRelabProductName(name: string): string {
  return formatProductName(name);
}

/** MSRP from relabdevelopment.com — prefer "reg. $X" over WooCommerce meta (often sale price). */
export function parseRelabRegisteredPrice(html: string): number | null {
  const regMatches = [
    ...html.matchAll(/reg\.?\s*\$([0-9]+(?:\.[0-9]{2})?)/gi),
  ];
  if (regMatches.length > 0) {
    const amounts = regMatches
      .map((m) => Number.parseFloat(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (amounts.length > 0) {
      return Math.max(...amounts);
    }
  }

  const priceMeta = parseMetaProductPrice(html);
  if (priceMeta) {
    return registeredPriceUsd(priceMeta.amount, priceMeta.currency);
  }

  return null;
}

function normalizeSoftubeSlug(value: string): string {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // keep raw value
  }
  return decoded.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function softubeSlugSpellingVariants(slug: string): string[] {
  const variants = [slug];
  if (slug.includes("equalizer")) {
    variants.push(slug.replace(/equalizer/g, "equaliser"));
  }
  if (slug.includes("equaliser")) {
    variants.push(slug.replace(/equaliser/g, "equalizer"));
  }
  if (slug.endsWith("-amplification")) {
    variants.push(slug.replace(/-amplification$/, "-amplifiers"));
  }
  if (slug.endsWith("-amplifiers")) {
    variants.push(slug.replace(/-amplifiers$/, "-amplification"));
  }
  if (slug.includes("chvrch")) {
    variants.push(slug.replace(/chvrch/g, "church"));
  }
  return variants;
}

function softubeSlugVariants(slug: string): string[] {
  const variants = new Set<string>();

  for (const spelling of softubeSlugSpellingVariants(slug)) {
    variants.add(normalizeSoftubeSlug(spelling));
    const parts = spelling.split("-").filter(Boolean);

    if (parts.length >= 2) {
      variants.add(
        normalizeSoftubeSlug(`${parts[0]}-${parts[parts.length - 1]}`),
      );
    }
    if (parts.length >= 3) {
      variants.add(normalizeSoftubeSlug(parts.slice(-2).join("-")));
      variants.add(normalizeSoftubeSlug(parts.slice(-3).join("-")));
    }
  }

  return [...variants];
}

function softubeMediaFilename(url: string): string | null {
  const parts = url.split("/media/");
  if (parts.length < 2) return null;
  return parts[parts.length - 1].split("/").pop()?.split("?")[0] ?? null;
}

function softubeSlugMatchInFilename(
  filename: string,
  slug: string,
): "full" | "partial" | "none" {
  const fnLower = softubeDecodeFilename(filename).toLowerCase();

  for (const variant of softubeSlugSpellingVariants(slug)) {
    if (fnLower.includes(variant.toLowerCase())) return "full";
  }

  const parts = slug.split("-").filter(Boolean);
  for (let n = Math.min(4, parts.length); n >= 2; n--) {
    const suffix = parts.slice(-n).join("-");
    for (const variant of softubeSlugSpellingVariants(suffix)) {
      if (fnLower.includes(variant.toLowerCase())) return "partial";
    }
  }
  for (let n = 2; n <= Math.min(3, parts.length); n++) {
    const prefix = parts.slice(0, n).join("-");
    for (const variant of softubeSlugSpellingVariants(prefix)) {
      if (fnLower.includes(variant.toLowerCase())) return "partial";
    }
  }

  return "none";
}

function softubeConflictingProduct(filename: string, slug: string): boolean {
  const fn = filename.toLowerCase();
  const slugLower = slug.toLowerCase();

  const pairs: Array<[string, string]> = [
    ["zener-limiter", "zener-bender"],
    ["curve-bender", "zener-bender"],
    ["germanium-compressor", "zener-bender"],
    ["germanium-compressor", "zener-limiter"],
    ["curve-bender", "zener-limiter"],
  ];

  for (const [needle, conflict] of pairs) {
    if (!slugLower.includes(needle)) continue;
    if (fn.includes(conflict) && !fn.includes(needle)) return true;
  }

  const sharedPrefixes = ["empirical-labs-", "chandler-limited-"];
  for (const prefix of sharedPrefixes) {
    if (!slugLower.startsWith(prefix)) continue;
    if (!fn.includes(prefix)) continue;

    const slugTail = slugLower.slice(prefix.length);
    const fnTailMatch = fn.match(
      new RegExp(`${prefix.replace(/-/g, "\\-")}([a-z0-9-]+)`),
    );
    if (!fnTailMatch?.[1]) continue;

    const slugKey = slugTail.split("-").slice(0, 2).join("-");
    const fnKey = fnTailMatch[1].split("-").slice(0, 2).join("-");
    if (slugKey && fnKey && slugKey !== fnKey && !fn.includes(slugKey)) {
      return true;
    }
  }

  return false;
}

function collectSoftubeCdnUrls(html: string): string[] {
  const urls = [
    ...html.matchAll(/https:\/\/cdn\.softube\.com\/[^"'\s)]+/gi),
  ].map((match) => match[0].replace(/&amp;/g, "&"));

  return [...new Set(urls)];
}

function softubeDecodeFilename(filename: string): string {
  try {
    return decodeURIComponent(filename);
  } catch {
    return filename;
  }
}

function scoreSoftubeImageUrl(url: string, slug: string): number {
  const lower = url.toLowerCase();
  if (/\.svg(\?|$)|\.gif(\?|$)/i.test(lower)) return -1;

  const filename = softubeMediaFilename(url);
  if (!filename) return -1;

  const fnLower = filename.toLowerCase();
  if (softubeConflictingProduct(filename, slug)) return -1;

  const match = softubeSlugMatchInFilename(filename, slug);
  if (match === "none") return -1;

  if (
    /logo|favicon|placeholder|walkthrough|story-|endorser|soundcloud|console-1-ready|extended-features|subcategories-thumbnail|plug-ins-page|page-thumbnail|mixing-and-guitar|background-image|[-/]vh[-/]|vh-\d+x\d+|2560x\d+|video-thumbnail|hardware-\d|hero-commercial|hero-walkthrough|general-hero|sections-new/.test(
      lower,
    )
  ) {
    return -1;
  }
  if (/product-thumbnail-dark|thumbnail-dark/.test(lower)) return -1;

  let score = match === "full" ? 20 : 10;

  if (/high-res-gui/i.test(lower)) score += 40;
  else if (/-gui-on\b|[-/]gui\.|[-/](?:[\w-]+-)?gui\./i.test(lower)) score += 36;
  else if (/gh-combo/i.test(lower)) score += 42;
  else if (/thumbnail-1200x1200/i.test(lower)) score += 38;
  else if (/product-image/i.test(lower)) score += 32;
  else if (/composite/i.test(lower)) score += 30;
  else if (/web-img/i.test(lower)) score += 28;
  else if (/-gh-/i.test(lower)) score += 14;
  else if (/product-thumbnail/i.test(lower)) score += 4;
  else if (/thumbnail/i.test(lower)) score += 2;

  const dimMatch = url.match(/\/(\d+)-(\d+)-\d+-(?:png|jpg|jpeg)\./i);
  if (dimMatch) {
    score += Math.min(8, Math.floor(Number(dimMatch[1]) / 250));
  }
  if (/\/png\/media\//i.test(url)) score += 4;

  return score;
}

/** Prefer plugin GUI screenshots from Softube product pages over listing thumbnails. */
export function resolveSoftubeProductImage(
  html: string,
  slug: string,
): string | null {
  const urls = collectSoftubeCdnUrls(html);
  let best: { url: string; score: number } | null = null;

  for (const url of urls) {
    const score = scoreSoftubeImageUrl(url, slug);
    if (score < 8) continue;
    if (!best || score > best.score) {
      best = { url, score };
    }
  }

  return best?.url ?? null;
}

export function resolveFabFilterProductImage(html: string): string | null {
  // Prefer GUI feature screenshots over lifestyle hero/intro art.
  const feature = html.match(
    /https:\/\/cdn-b\.fabfilter\.com\/img\/products\/[^"'\s]+-feature-1\.jpg[^"'\s]*/i,
  );
  if (feature?.[0]) return feature[0].replace(/&amp;/g, "&");

  const screenshot = html.match(
    /https:\/\/cdn-b\.fabfilter\.com\/img\/products\/[^"'\s]+-screenshot\.jpg[^"'\s]*/i,
  );
  if (screenshot?.[0]) return screenshot[0].replace(/&amp;/g, "&");

  const hero = html.match(
    /https:\/\/cdn-b\.fabfilter\.com\/img\/products\/[^"'\s]+-hero[^"'\s]+\.jpg[^"'\s]*/i,
  );
  if (hero?.[0]) return hero[0].replace(/&amp;/g, "&");

  const intro = html.match(
    /https:\/\/cdn-b\.fabfilter\.com\/img\/products\/[^"'\s]+-intro\.jpg[^"'\s]*/i,
  );
  if (intro?.[0]) return intro[0].replace(/&amp;/g, "&");

  return null;
}

/** Gallery / feature images on uaudio.com product pages (not always in Shopify JSON). */
export function collectUaudioProductImageUrls(html: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  const add = (rawName: string) => {
    let name = rawName.replace(/&amp;/g, "&").split("?")[0];
    name = name.replace(/_x\d+\.(png|jpe?g)$/i, ".$1");
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    if (/hero|testimonial|feature_sm|x280|badge|logo/i.test(key)) return;
    if (!/gallery|feature_lg/i.test(key)) return;
    seen.add(key);
    urls.push(`https://www.uaudio.com/cdn/shop/files/${name}`);
  };

  for (const match of html.matchAll(/\/files\/([^"'?\s)]+\.(?:png|jpe?g))/gi)) {
    add(match[1]);
  }

  return urls;
}

function isSslImageNoise(lower: string, slug?: string): boolean {
  const allowBundleBanner =
    slug?.includes("bundle") === true &&
    /band[_-]?bundle|bundle[_-]?banner/i.test(lower);

  if (/presta-product-image/i.test(lower)) return true;
  if (/en-default|no[_-]?image|placeholder/i.test(lower)) return true;
  if (
    /web[_% ]banners|hero[_-]?shot|webpage_banner|web[_-]header/i.test(lower)
  ) {
    return true;
  }
  if (/banner/i.test(lower) && !allowBundleBanner) return true;
  if (
    /background[_-]?texture|feature[_-]?background|studio[_-]?background/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (/thumbnail|maxresdefault|video/i.test(lower)) return true;
  if (
    /quotes|trial|buy[_% ]now|button|creator[_-]?pack|slate[_-]?sounds/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    /%20off|\d+%-off|special[_-]?offer|exclusive[_-]?pricing/i.test(lower)
  ) {
    return true;
  }
  if (/pe[_% ]gold|production[_-]?expert|webpage%20pe%20gold/i.test(lower)) {
    return true;
  }
  if (/3500x583|banner[_% ]blank|texture\./i.test(lower)) return true;
  if (/features_/i.test(lower)) return true;
  if (/\/assets\/uploads\/products\/.*web[_% ]image.*off/i.test(lower)) {
    return true;
  }
  if (/\/assets\/uploads\/images\/.*web[_% ]image/i.test(lower)) return true;

  return false;
}

function isSslGuiFilename(lower: string): boolean {
  return /(?:^|[/_\s%-])gui(?:[._\s%-]|$)|%20gui|web_gui|-gui-|gui-webpage|gui-with|gui_webpage|-gui\./i.test(
    lower,
  );
}

function collectSslImageUrls(html: string, pageUrl: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  const add = (raw: string) => {
    try {
      const url = new URL(raw.replace(/&amp;/g, "&"), pageUrl).href;
      const key = url.toLowerCase();
      if (seen.has(key)) return;
      if (!/solidstatelogic\.com/i.test(url)) return;
      if (!/\.(?:png|jpe?g|webp)(?:\?|$)/i.test(url)) return;
      seen.add(key);
      urls.push(url);
    } catch {
      // ignore malformed URLs
    }
  };

  for (const match of html.matchAll(
    /https?:\/\/[^"'\s)]+\.(?:png|jpe?g|webp)(?:\?[^"'\s)]*)?/gi,
  )) {
    add(match[0]);
  }

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    add(match[1]);
  }

  return urls;
}

function scoreSslImageUrl(url: string, slug: string): number {
  const lower = url.toLowerCase();
  if (isSslImageNoise(lower, slug)) return -1;
  if (!/solidstatelogic\.com/i.test(lower)) return -1;

  const slugNorm = slug.replace(/-/g, "");
  let score = 0;

  const storeMatch = lower.match(
    /store\.solidstatelogic\.com\/(\d+)-large_default\/([^./?]+)/,
  );
  if (storeMatch) {
    const storeSlug = storeMatch[2].replace(/\.(?:jpe?g|png|webp)$/, "");
    if (
      storeSlug === slug ||
      storeSlug.replace(/-/g, "") === slugNorm
    ) {
      score += 45;
    } else {
      return -1;
    }
  }

  if (
    /\/assets\/uploads\/[^/]+\.(?:png|jpe?g)(?:\?|$)/i.test(lower) &&
    !/\/assets\/uploads\/(?:components|template|products|images)\//i.test(lower)
  ) {
    score += 48;
  }
  if (/\/assets\/uploads\/images\/plugins\//i.test(lower)) score += 42;
  if (
    /\/assets\/uploads\/products\/[^/]+\.(?:png|jpe?g)(?:\?|$)/i.test(lower) &&
    !/web[_% ]image|off|banner/i.test(lower)
  ) {
    score += 40;
  }
  if (/\/assets\/uploads\/products\/[^/]+\.jpe?g(?:\?|$)/i.test(lower)) {
    score -= 28;
  }

  let filename = lower.split("/").pop() ?? "";
  try {
    filename = decodeURIComponent(filename).toLowerCase();
  } catch {
    filename = filename.toLowerCase();
  }
  const slugTokens = slugParts(slug).filter((part) => part.length > 3);
  if (
    /\.png(?:\?|$)/i.test(lower) &&
    /phpthumbof\/cache/i.test(lower) &&
    slugTokens.some((token) => filename.includes(token))
  ) {
    score += 38;
  }

  if (isSslGuiFilename(lower)) score += 32;
  if (/_tile_/i.test(lower)) score += 30;
  if (/mixbus_11_pro_tile/i.test(lower) && slug === "mixbus-11-pro") score += 25;
  if (/mixbus_11_tile/i.test(lower) && slug === "mixbus-11") score += 25;
  if (/\.png(?:\?|$)/i.test(lower)) score += 5;

  if (slug === "ssl-4k-e" && /4k[_%\s-]*e|4000[_%\s-]*e/i.test(lower)) {
    score += 22;
  }
  if (
    slug === "ssl-4k-g-channel-strip" &&
    /4k[_%\s-]*g|4000[_%\s-]*g|sl_4000_g/i.test(lower)
  ) {
    score += 22;
  }
  if (slug.includes("bundle") && /band[_-]?bundle/i.test(lower)) {
    score += 30;
  }
  if (
    slug === "ssl-band-bundle" &&
    /guitarstrip|drumstrip|vocalstrip/i.test(lower)
  ) {
    score -= 80;
  }
  if (!slug.includes("band-bundle") && /---band-bundle/i.test(lower)) {
    score -= 50;
  }

  if (
    slug === "ssl-4k-e" &&
    /uc1|channelstrips|4000[_%\s-]*e[_%\s-]*brochure|brochure/i.test(lower)
  ) {
    score -= 40;
  }

  if (
    /\/assets\/components\/phpthumbof\/cache\//i.test(lower) &&
    /-(?:drive|comp|eq|gate|phase|filter)\.[a-f0-9]+\.(?:png|jpe?g)/i.test(
      lower,
    )
  ) {
    score -= 30;
  }

  for (const part of slugParts(slug)) {
    if (part.length > 2 && lower.includes(part)) score += 2;
  }
  if (/\b4k\b/i.test(slug) && /4k/i.test(lower)) score += 4;

  if (/\/assets\/uploads\/products\//i.test(lower) && score < 30) score -= 15;

  return score;
}

/** Prefer plugin GUI screenshots from SSL marketing/store pages over OG promos. */
function pickBestSslImageUrl(
  urls: string[],
  slug: string,
): string | null {
  let best: { url: string; score: number } | null = null;

  for (const url of urls) {
    const score = scoreSslImageUrl(url, slug);
    if (score < 8) continue;
    if (!best || score > best.score) {
      best = { url, score };
    }
  }

  return best?.url ?? null;
}

export function resolveSslProductImage(
  html: string,
  pageUrl: string,
  slug: string,
): string | null {
  const urls = collectSslImageUrls(html, pageUrl);
  const og = resolveOgImage(html, pageUrl);
  if (og) urls.push(og);

  return pickBestSslImageUrl(urls, slug);
}

export function resolveSslProductImageFromHtmlPages(
  pages: Array<{ html: string; pageUrl: string }>,
  slug: string,
): string | null {
  const urls: string[] = [];

  for (const page of pages) {
    urls.push(...collectSslImageUrls(page.html, page.pageUrl));
    const og = resolveOgImage(page.html, page.pageUrl);
    if (og) urls.push(og);
  }

  return pickBestSslImageUrl(urls, slug);
}

function isSlateImageNoise(lower: string): boolean {
  if (
    /_gui_|gui-image|gui_screen|userinterface|user-interface|deconstructed_gui/i.test(
      lower,
    )
  ) {
    return false;
  }

  return /logo|icon|favicon|avatar|menu-bg|menu-featured|halloween|cropped-untitled|arrow-up-down|headline-stroke|landing-page-introducing|walkthrough|standing-3qtr|floating_angled|floating-angled|videothumb|thumbnail-dark|play-button|play_button|headphones\.png|mask-group|mask_group|fpo-|frame-11|rectangle-|group-132|gigapixel|photoroom|video-feature|presetbrowser|macrostight|sidechaintight|new-vmr-play|vmr_3_thumbnail|mix-templates|ultimate-guide-to-eq|typeSDC-card|header-background|background-scaled|precision-icon|waves-icon|testimonial|\.jpg\?/i.test(
    lower,
  );
}

function slateSlugTokens(slug: string): string[] {
  return slug
    .replace(/-plugin$|-bundle$/g, "")
    .split("-")
    .filter((part) => part.length > 1 || /^\d+$/.test(part));
}

function slateConflictingProduct(lower: string, slug: string): boolean {
  const pairs: Array<[string, RegExp]> = [
    ["metapitch", /infinity-bass/i],
    ["fg-2a-compressor", /fg-@a|fg-a-1|fg-a\.png/i],
    ["fg-a", /fg-2a|fg-@a/i],
    ["infinity-bass", /metapitch/i],
    ["submerge", /heatwave/i],
  ];

  for (const [needle, conflict] of pairs) {
    if (!slug.includes(needle)) continue;
    if (conflict.test(lower) && !lower.includes(needle.replace(/-/g, ""))) {
      return true;
    }
  }

  return false;
}

function scoreSlateImageUrl(
  url: string,
  slug: string,
  isBundle: boolean,
): number {
  const lower = url.toLowerCase();
  if (!lower.includes("slatedigital.com/wp-content/uploads")) return -1;
  if (isSlateImageNoise(lower)) return -1;
  if (slateConflictingProduct(lower, slug)) return -1;

  let score = 0;

  if (/userinterface|user-interface|user_interface/i.test(lower)) score += 28;
  if (/(?:^|[/_-])gui(?:[._-]|$)|_gui\.|gui-screen|plugin-gui|deconstructed_gui/i.test(lower)) {
    score += 22;
  }
  if (/\binterface\b/i.test(lower)) score += 18;
  if (/\bscreen\b/i.test(lower)) score += 12;
  if (/overview-\d|overview_\d|product-page|website-product/i.test(lower)) {
    score += 14;
  }

  if (slug === "vmr-3" && /vmr3-rack|vmr-3-rack|vmr_3.*rack/i.test(lower)) {
    score += 30;
  }
  if (slug === "fresh-air" && /freshair_angled|fresh-air/i.test(lower)) {
    score += 20;
  }
  if (isBundle && /bundle|collection|gate-classic|gate-drums/i.test(lower)) {
    score += 12;
  }
  if (/pluginpage|plugin-on-page|feature-\d/i.test(lower) && isBundle) {
    score += 10;
  }
  if (/featured-image|featured-imge/i.test(lower)) score += 10;
  if (/top-cell/i.test(lower)) score += 8;
  if (/background-image|background_image/i.test(lower)) score -= 35;
  if (/hero|banner/i.test(lower)) score -= 10;
  if (/icon/i.test(lower)) score -= 20;
  if (/-\d+x\d+\.(?:png|jpe?g|webp)/i.test(lower)) score -= 8;

  const slugNorm = slug.replace(/[^a-z0-9]/g, "");
  const fileNorm = lower.replace(/[^a-z0-9]/g, "");
  if (fileNorm.includes(slugNorm.slice(0, Math.min(12, slugNorm.length)))) {
    score += 14;
  }

  for (const token of slateSlugTokens(slug)) {
    if (token.length > 2 && lower.includes(token)) score += 3;
  }

  if (/\.png(?:\?|$)/i.test(lower)) score += 4;
  if (/\.webp(?:\?|$)/i.test(lower)) score += 2;

  return score;
}

function collectSlateUploadUrls(html: string, pageUrl: string): string[] {
  const seen = new Set<string>();
  const urls: string[] = [];

  const add = (raw: string) => {
    try {
      const url = new URL(raw.replace(/&amp;/g, "&"), pageUrl).href;
      const key = url.toLowerCase();
      if (seen.has(key)) return;
      if (!/slatedigital\.com\/wp-content\/uploads/i.test(url)) return;
      seen.add(key);
      urls.push(url);
    } catch {
      // ignore malformed URLs
    }
  };

  for (const match of html.matchAll(
    /https:\/\/slatedigital\.com\/wp-content\/uploads\/[^"'\s)]+\.(?:png|jpe?g|webp)(?:\?[^"'\s)]*)?/gi,
  )) {
    add(match[0]);
  }

  for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    add(match[1]);
  }

  return urls;
}

function pickBestSlateImageUrl(
  urls: string[],
  slug: string,
  isBundle: boolean,
): string | null {
  let best: { url: string; score: number } | null = null;

  for (const url of urls) {
    const score = scoreSlateImageUrl(url, slug, isBundle);
    if (score < 6) continue;
    if (!best || score > best.score) {
      best = { url, score };
    }
  }

  return best?.url ?? null;
}

export function resolveSlateProductImage(
  html: string,
  pageUrl: string,
  slug: string,
  options?: { isBundle?: boolean },
): string | null {
  const isBundle = options?.isBundle ?? /bundle|collection/i.test(slug);
  const urls = collectSlateUploadUrls(html, pageUrl);
  const og = resolveOgImage(html, pageUrl);
  if (og) urls.push(og);

  const best = pickBestSlateImageUrl(urls, slug, isBundle);
  if (best) return best;

  if (
    og &&
    !isSlateImageNoise(og.toLowerCase()) &&
    !slateConflictingProduct(og.toLowerCase(), slug)
  ) {
    return og;
  }

  return null;
}

const SLATE_NAME_OVERRIDES: Record<string, string> = {
  "ana2-ultra-bundle-online-synthesizer-plugin": "ANA 2 Ultra Bundle",
  "chorus-d-bundle-plugin": "Chorus D Bundle",
  "eiosis-e2deesser-deesser-plugin": "Eiosis E2 Deesser",
  "eiosis-aireq": "Eiosis AirEQ",
  "fg-116-blue-series-fet-compressors": "FG-116 Blue Series FET Compressors",
  "fg-2a-compressor-plugin": "FG-2A",
  "fg-stress-distressor-plugin": "FG-Stress",
  "fg-x-2-mastering-plugin": "FG-X 2",
  "infinity-bass-plugin": "Infinity Bass",
  "kilohearts-bundle": "Kilohearts Bundle",
  "metapitch-pitch-shifting-plugin": "MetaPitch",
  "mo-tt-ott-plugin-multiband-compressor": "MO-TT",
  "sd-3a-compressor-plugin": "SD-3A",
  "sd-pe1-passive-eq-plugin": "SD-PE1",
  "submerge-sidechain-compressor-plugin": "Submerge",
  "the-monster-extreme-dynamic-processor": "The Monster",
  "transient-shaper-plugin": "Transient Shaper",
  thu: "THU Slate Edition",
  "vmr-3": "VMR 3.0",
};

export function normalizeSlateProductName(name: string, slug?: string): string {
  if (slug && SLATE_NAME_OVERRIDES[slug]) {
    return SLATE_NAME_OVERRIDES[slug];
  }

  let normalized = decodeHtmlEntities(name).trim();
  normalized = normalized
    .replace(/\s*:\s*Free\s+Plugin\b.*$/i, "")
    .replace(/\s*-\s*NOW AVAILABLE!?\s*$/i, "")
    .replace(/\s*-\s*Now Available!?\s*$/i, "")
    .replace(/\s+Plugin\s+by\s+Slate\s+Digital\s*$/i, "")
    .replace(/\s+by\s+Slate\s+Digital\s*$/i, "")
    .trim();

  const parts = normalized.split(/\s*[-–—]\s*/);
  if (parts.length > 1) {
    const first = parts[0].trim();
    const rest = parts.slice(1).join(" ");
    const isMarketingRest =
      /plugin|shift your|make your|essential|multiband|pitch shifting|sidechain|analog-modeled|available now/i.test(
        rest,
      );
    if (isMarketingRest && first.length >= 2) {
      normalized = first;
    }
  }

  return normalized.replace(/\s+Plugin\s*$/i, "").trim();
}

export function shouldSkipSlateCatalogItem(item: {
  slug: string;
  name?: string;
}): boolean {
  const { slug } = item;

  const skipSlugs = new Set([
    "plugins",
    "about",
    "academy",
    "blog",
    "careers",
    "complete-access",
    "complete-access-bundle",
    "education-pricing",
    "feed",
    "find-a-dealer",
    "legacy-products",
    "privacy-policy",
    "sitemap",
    "xmlrpc",
    "wp-admin",
    "wp-includes",
    "heatwave",
    "audified-u73b",
    "ana2-ultra-bundle-online-synthesizer-plugin",
    "fresh-air",
    "kilohearts-bundle",
    "lustrous-plates",
    "repeater-delay",
    "revival",
    "the-monster-extreme-dynamic-processor",
    "thu",
    "vmr-3",
    "virtu-mastering-software",
    "virtu-online-mastering-software",
    "virtual-microphone-system",
    "microphone-models",
    "ml-1a-modeling-microphone",
    "ml-2a-modeling-microphone",
    "ml2-modeling-microphone",
    "radio-france-mic-expansion",
    "strongroom-london",
    "slatedigital.com",
  ]);

  if (skipSlugs.has(slug)) return true;
  if (slug.startsWith("#")) return true;
  if (/^ml\d?-/i.test(slug) || slug.startsWith("ml-")) return true;
  if (/subscription|all access pass/i.test(item.name ?? "")) return true;

  return false;
}

export function resolveProductImage(
  html: string,
  pageUrl: string,
  options?: { slug?: string; isBundle?: boolean },
): string | null {
  if (/fabfilter\.com/i.test(pageUrl)) {
    const fab = resolveFabFilterProductImage(html);
    if (fab) return fab;
  }

  if (/softube\.com/i.test(pageUrl) && options?.slug) {
    const softube = resolveSoftubeProductImage(html, options.slug);
    if (softube) return softube;
  }

  if (/solidstatelogic\.com/i.test(pageUrl) && options?.slug) {
    const ssl = resolveSslProductImage(html, pageUrl, options.slug);
    if (ssl) return ssl;
  }

  if (/slatedigital\.com/i.test(pageUrl) && options?.slug) {
    const slate = resolveSlateProductImage(html, pageUrl, options.slug, {
      isBundle: options.isBundle,
    });
    if (slate) return slate;
  }

  const og = resolveOgImage(html, pageUrl);
  if (
    og &&
    !/logo|favicon|icon|placeholder|en-default|no[_-]?image/i.test(og)
  ) {
    return og;
  }

  const imgMatch = html.match(
    /"large_default"\s*:\s*\{\s*"url"\s*:\s*"([^"]+)"/i,
  );
  if (imgMatch?.[1]) {
    return imgMatch[1].replace(/\\\//g, "/");
  }

  return null;
}

export function normalizeSoftubeProductName(name: string): string {
  return decodeHtmlEntities(name)
    .replace(/\s+plug-?in\s*$/i, "")
    .replace(/\s+plugin\s*$/i, "")
    .trim();
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(Number.parseInt(num, 10)),
    );
}

export function isSoftubeCategoryHubTitle(title: string): boolean {
  const decoded = decodeHtmlEntities(title).trim();
  return (
    /\bplugin\s*-\s*Softube$/i.test(decoded) ||
    /^compressors\s*&\s*limiters$/i.test(decoded) ||
    /^equalizers\s+plugin$/i.test(decoded) ||
    /^channel\s+strips$/i.test(decoded) ||
    /^equalizers$/i.test(decoded)
  );
}

export function shouldSkipSoftubeCatalogItem(item: {
  name: string;
  slug: string;
  registeredPrice?: number;
}): boolean {
  const name = decodeHtmlEntities(item.name);
  const { slug } = item;

  const skipSlugs = new Set([
    "compressors-limiters",
    "channel-strips",
    "flow-subscriptions",
    "free-products",
    "free-plugins",
    "equalizers",
    "eqs",
  ]);

  if (skipSlugs.has(slug)) return true;
  if (slug.startsWith("equalizers-")) return true;
  if (item.registeredPrice === 0 && /^(channel strips|compressors|equalizers)$/i.test(name)) {
    return true;
  }
  if (/subscription/i.test(name)) return true;
  if (/free\s+plugins?/i.test(name)) return true;
  if (item.registeredPrice === 0 && /\bfree\b/i.test(name)) return true;

  return isSoftubeCategoryHubTitle(name);
}

export function normalizeProductSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
