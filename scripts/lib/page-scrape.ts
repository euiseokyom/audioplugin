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

function isSslImageNoise(lower: string): boolean {
  return (
    /en-default|no[_-]?image|placeholder/i.test(lower) ||
    /banner|web[_% ]banners|hero[_-]?shot|webpage_banner|web[_-]header/i.test(
      lower,
    ) ||
    /background[_-]?texture|feature[_-]?background|studio[_-]?background/i.test(
      lower,
    ) ||
    /thumbnail|maxresdefault|video/i.test(lower) ||
    /quotes|trial|buy[_% ]now|button|creator[_-]?pack|slate[_-]?sounds/i.test(
      lower,
    ) ||
    /%20off|\d+%-off|special[_-]?offer|exclusive[_-]?pricing/i.test(lower) ||
    /pe[_% ]gold|production[_-]?expert|webpage%20pe%20gold/i.test(lower) ||
    /3500x583|banner[_% ]blank|texture\./i.test(lower) ||
    /features_/i.test(lower) ||
    /\/assets\/uploads\/products\/.*web[_% ]image.*off/i.test(lower)
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
  if (isSslImageNoise(lower)) return -1;
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
    !/\/assets\/uploads\/(?:components|template|products)\//i.test(lower)
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

  if (/-gui-|gui-webpage|gui-with|gui_webpage|-gui\./i.test(lower)) score += 28;
  if (/_tile_/i.test(lower)) score += 30;
  if (/mixbus_11_pro_tile/i.test(lower) && slug === "mixbus-11-pro") score += 25;
  if (/mixbus_11_tile/i.test(lower) && slug === "mixbus-11") score += 25;
  if (/\.png(?:\?|$)/i.test(lower)) score += 5;

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

export function resolveProductImage(
  html: string,
  pageUrl: string,
  options?: { slug?: string },
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
