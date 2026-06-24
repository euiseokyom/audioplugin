import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { productWebpDir } from "../../lib/catalog/product-image-fs";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

export const WEBP_SIZE = 365;

/** Max fraction of the tile the GUI may occupy (transparent margin on all sides). */
const TILE_FILL_RATIO = 0.95;

/** Horizontal nudge in pixels (positive = shift right) for specific product tiles. */
export const IMAGE_PLACEMENT_OFFSETS: Record<string, number> = {
  "soundtoys-5": 40,
};

export type ImageTileOptions = {
  processingProfile?: ImageProcessingProfile;
  tileFillRatio?: number;
  skipEdgeBlackStrip?: boolean;
  skipEdgeBlackColumnStrip?: boolean;
  /** Skip bottom edge row strip only (preserve dark bottom GUI chrome). */
  skipEdgeBlackBottomRowStrip?: boolean;
  skipMatteSurround?: boolean;
  /** Skip sharp trim passes — grey GUI edges match threshold and get cropped. */
  skipTrimTransparentMargins?: boolean;
  /** Pre-trim uniform square surround (e.g. Softube 2501² grey padding) before letterbox. */
  trimSurroundThreshold?: number;
  /** Max alpha for stripSoftNearBlackAlpha (default 140). */
  stripSoftNearBlackAlphaMax?: number;
  /** Light fringe smudge on bundle collage edges after resize (Sonnox bundles). */
  softenEdgeHalos?: boolean;
  /** Contain-fit only — skip background stripping and alpha fringe cleanup. */
  rawLetterbox?: boolean;
};

/** Per-slug tile fit and background handling overrides. */
export const IMAGE_SLUG_OPTIONS: Record<string, ImageTileOptions> = {
  // Mastering the Mix — full-bleed dark GUIs; default PA pipeline crops top/bottom chrome.
  animate: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  bassroom: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  "expose-2": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  "faster-master": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  fuser: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  levels: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  limiter: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  mixroom: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  reference: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  reso: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  stereovault: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  // McDSP — black bundle collages fill the frame; default matte-row crop leaves
  // opaque black surround. Light keys edge letterbox without geometric crop.
  "classic-pack": {
    processingProfile: "light",
  },
  // White box art — default cropMatteRows clips the bottom NATIVE/HD strip.
  "emerald-pack": {
    processingProfile: "light",
  },
  // Dark bottom chrome is classified as removable matte; light skips row crop.
  "sa-3": {
    processingProfile: "light",
  },
  // Dark bottom bar — stripSoftNearBlackAlpha keys anti-aliased chrome as letterbox.
  "phils-cascade": {
    skipEdgeBlackStrip: true,
  },
  // Dark top title bar — light stripEdgeBlackRows keys it as letterbox and trims the header.
  "bx_saturator-v2": {
    skipEdgeBlackStrip: true,
  },
  "80-series": {
    skipEdgeBlackStrip: true,
  },
  "bax-eq": {
    skipEdgeBlackStrip: true,
  },
  "bus-compressor": {
    skipEdgeBlackStrip: true,
  },
  g8: {
    skipEdgeBlackStrip: true,
  },
  "nseq-2": {
    skipEdgeBlackStrip: true,
  },
  optomax: {
    skipEdgeBlackStrip: true,
  },
  "tcl-2": {
    skipEdgeBlackStrip: true,
  },
  triad: {
    skipEdgeBlackStrip: true,
  },
  // Left silver/white rack frame connects to border — matte flood keys it, fringe banding follows.
  nvelope: {
    skipMatteSurround: true,
  },
  // Top grey rack frame — matte flood + fringe cleanup band the bevel.
  museq: {
    skipMatteSurround: true,
  },
  mpressor: {
    skipMatteSurround: true,
  },
  rz062: {
    skipMatteSurround: true,
  },
  "indent-2": {
    skipEdgeBlackStrip: true,
    skipMatteSurround: true,
  },
  byome: {
    skipTrimTransparentMargins: true,
    skipEdgeBlackStrip: true,
  },
  "lo-fi-af": {
    skipTrimTransparentMargins: true,
    skipEdgeBlackStrip: true,
  },
  zip: {
    skipEdgeBlackStrip: true,
  },
  sandman: {
    skipTrimTransparentMargins: true,
    skipEdgeBlackStrip: true,
  },
  "vss-2": {
    skipMatteSurround: true,
  },
  // PluginFox VMR modules — dark top/bottom rack chrome is keyed as letterbox by light strip.
  "fg-2a-compressor-plugin": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
    tileFillRatio: 0.98,
  },
  "fg-a": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
    tileFillRatio: 0.98,
  },
  // Softube square CDN shot — grey surround fills the tile when not pre-trimmed.
  "chandler-limited-zener-bender-for-console-1": {
    trimSurroundThreshold: 40,
    skipEdgeBlackStrip: true,
  },
  // SSL — matte flood keys rack/bevel chrome; trim eats anti-aliased GUI borders.
  guitarstrip: {
    skipMatteSurround: true,
    skipEdgeBlackStrip: true,
  },
  "ssl-native-drumstrip": {
    skipMatteSurround: true,
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
  },
  // White JPEG padding — trim removes surround; matte flood keys top rack bevel.
  "g3-multibuscomp": {
    trimSurroundThreshold: 40,
    skipMatteSurround: true,
  },
  // Dark bottom bar reads as near-black letterbox — bottom row strip crops it flat.
  "ssl-native-channel-strip-2": {
    skipEdgeBlackBottomRowStrip: true,
    stripSoftNearBlackAlphaMax: 240,
  },
  "ssl-native-bus-compressor-2": {
    skipMatteSurround: true,
    skipEdgeBlackStrip: true,
  },
  // Sonnox bundle collages — drop shadow on the right survives trim@40 and letterboxes
  // the tile left + small; trim@70 + softenEdgeHalos matches framing across bundles.
  "sonnox-broadcast-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  "sonnox-elite-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  "sonnox-enhance-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  "sonnox-live-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  "sonnox-essential-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  "sonnox-vocal-production-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  "sonnox-mix-bus-loudness-bundle": {
    trimSurroundThreshold: 70,
    skipMatteSurround: true,
    softenEdgeHalos: true,
  },
  // Waves — manufacturer light+skip degrades these; default preserves rack/UI chrome.
  metaflanger: { processingProfile: "default" },
  mondomod: { processingProfile: "default" },
  "abbey-road-rs124-compressor": { processingProfile: "default" },
  // Lifestyle shot — manual original (600×494, alpha hardened, reflection trimmed); default only.
  "cosmos-sample-finder": { processingProfile: "default" },
  "waves-tune": { processingProfile: "default" },
  "waves-tune-lt": { processingProfile: "default" },
  "waves-tune-real-time": { processingProfile: "default" },
  // Matte flood keys light GUI chrome — skipMatteSurround preserves edges.
  "clarity-vx-dereverb": { skipMatteSurround: true },
  "l2-ultramaximizer": { processingProfile: "default" },
  "ir1-convolution-reverb": { processingProfile: "default" },
  "ir-l-convolution-reverb": { processingProfile: "default" },
  "ir-live-convolution-reverb": { processingProfile: "default" },
  "c1-compressor": { skipMatteSurround: true },
  "ultrapitch": { skipMatteSurround: true },
  "linear-phase-multiband-compressor": { processingProfile: "default" },
  "linear-phase-eq": { processingProfile: "default" },
  maxxvolume: { processingProfile: "default" },
  "um225-um226": { processingProfile: "default" },
  "l3-multimaximizer": { processingProfile: "default" },
  // Antares Articulator — manual GUI shot; contain-fit only, no background pipeline.
  "creative-vocal-effects-articulator": {
    rawLetterbox: true,
    tileFillRatio: 0.96,
  },
  // Antares Aspire — wide GUI shot; raw letterbox like Articulator, slightly inset for aspect ratio.
  "creative-vocal-effects-aspire": {
    rawLetterbox: true,
    tileFillRatio: 0.94,
  },
  // Antares Auto-Tune Pro 11 — manual GUI shot; same raw letterbox treatment as Aspire.
  pro: {
    rawLetterbox: true,
    tileFillRatio: 0.94,
  },
  // Antares Duo — manual GUI shot; same raw letterbox treatment as Aspire.
  "creative-vocal-effects-duo": {
    rawLetterbox: true,
    tileFillRatio: 0.94,
  },
  // Antares Vocal Prep — manual GUI shot; same raw letterbox treatment as Aspire.
  "ai-powered-vocal-chain-vocal-prep": {
    rawLetterbox: true,
    tileFillRatio: 0.94,
  },
};

/** UAD Pick Any / Custom bundle promo art — full-bleed dark background is intentional. */
const UAD_CUSTOM_BUNDLE_OPTIONS: ImageTileOptions = {
  processingProfile: "light",
  skipEdgeBlackStrip: true,
  skipTrimTransparentMargins: true,
  skipMatteSurround: true,
  tileFillRatio: 0.98,
};

function slugImageOptions(slug: string): ImageTileOptions | undefined {
  if (/^uad-custom-.*-bundle$/.test(slug)) return UAD_CUSTOM_BUNDLE_OPTIONS;
  // Legacy Shopify handle before Select → Custom merge
  if (slug === "uad-select-10-plus-10-bundle") return UAD_CUSTOM_BUNDLE_OPTIONS;
  return IMAGE_SLUG_OPTIONS[slug];
}

/** Per-manufacturer tile fit and background handling overrides. */
export const MANUFACTURER_IMAGE_OPTIONS: Record<string, ImageTileOptions> = {
  eventide: {
    processingProfile: "light",
    tileFillRatio: 0.98,
    skipEdgeBlackStrip: true,
  },
  "baby-audio": {
    processingProfile: "light",
  },
  "relab-development": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
  },
  // Dark GUI chrome at top/bottom is misclassified as matte by cropMatteRows in default.
  "plugin-alliance": {
    processingProfile: "light",
  },
  // eMo / OneKnob / Renaissance etc. — default cropMatteRows + edge strip clips top/bottom bars.
  waves: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
  },
  // PluginFox VMR modules — dark top/bottom rack chrome is keyed as letterbox.
  "slate-digital": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
    tileFillRatio: 0.98,
  },
  // PluginFox XLN GUI shots — default cropMatteRows + edge strip clips top/bottom bars.
  "xln-audio": {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
    tileFillRatio: 0.98,
  },
  // Square CDN shots — grey surround letterboxes the GUI; trim removes padding;
  // skipEdgeBlackStrip + skipTrimTransparentMargins preserve dark GUI chrome.
  sonnox: {
    processingProfile: "light",
    skipEdgeBlackStrip: true,
    skipTrimTransparentMargins: true,
    trimSurroundThreshold: 40,
    tileFillRatio: 0.95,
  },
};

/** Transparent letterbox — card CSS (bg-base-300) shows through, like Waves. */
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 } as const;

/** AVIF/JPEG bytes saved as .png — sharp keeps input format unless forced to PNG. */
async function toAlphaPng(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer).ensureAlpha().png().toBuffer();
}

export const DEFAULT_WEBP_DIR = path.join(ROOT, "public/images/products");

export type ImageProcessingProfile = "default" | "light";

export type ProcessProductImageOptions = {
  webpDir?: string;
  manufacturerTag?: string;
  /** Catalog file slug — picks up IMAGE_SLUG_OPTIONS when set. */
  slug?: string;
  /** Light: key letterbox only — no geometric crop from matte detection. */
  processingProfile?: ImageProcessingProfile;
  /** Fraction of the tile the GUI may occupy (default 0.95). */
  tileFillRatio?: number;
  /** Skip near-black edge row/column stripping (full-bleed product art). */
  skipEdgeBlackStrip?: boolean;
  /** Skip near-black edge column stripping only (preserve dark window side rails). */
  skipEdgeBlackColumnStrip?: boolean;
  /** Skip bottom edge row stripping only (preserve dark bottom GUI chrome). */
  skipEdgeBlackBottomRowStrip?: boolean;
  /** Keep white/gray letterbox opaque (plugin chrome corners on retailer shots). */
  skipMatteSurround?: boolean;
  /** Skip sharp trim passes — preserves anti-aliased GUI borders on retailer shots. */
  skipTrimTransparentMargins?: boolean;
  /** Pre-trim uniform square surround before letterbox (see IMAGE_SLUG_OPTIONS). */
  trimSurroundThreshold?: number;
  /** Max alpha for stripSoftNearBlackAlpha (default 140). */
  stripSoftNearBlackAlphaMax?: number;
  /** Light fringe smudge on bundle collage edges after resize (Sonnox bundles). */
  softenEdgeHalos?: boolean;
  /** Contain-fit only — skip background stripping and alpha fringe cleanup. */
  rawLetterbox?: boolean;
};

function resolveImageOptions(
  options?: ProcessProductImageOptions,
): Required<
  Pick<
    ProcessProductImageOptions,
    | "processingProfile"
    | "tileFillRatio"
    | "skipEdgeBlackStrip"
    | "skipEdgeBlackColumnStrip"
    | "skipEdgeBlackBottomRowStrip"
    | "skipMatteSurround"
    | "skipTrimTransparentMargins"
    | "trimSurroundThreshold"
    | "stripSoftNearBlackAlphaMax"
    | "softenEdgeHalos"
    | "rawLetterbox"
  >
> {
  const slugDefaults = options?.slug
    ? slugImageOptions(options.slug)
    : undefined;
  const manufacturerDefaults = options?.manufacturerTag
    ? MANUFACTURER_IMAGE_OPTIONS[options.manufacturerTag]
    : undefined;

  return {
    processingProfile:
      options?.processingProfile ??
      slugDefaults?.processingProfile ??
      manufacturerDefaults?.processingProfile ??
      "default",
    tileFillRatio:
      options?.tileFillRatio ??
      slugDefaults?.tileFillRatio ??
      manufacturerDefaults?.tileFillRatio ??
      TILE_FILL_RATIO,
    skipEdgeBlackStrip:
      options?.skipEdgeBlackStrip ??
      slugDefaults?.skipEdgeBlackStrip ??
      manufacturerDefaults?.skipEdgeBlackStrip ??
      false,
    skipEdgeBlackColumnStrip:
      options?.skipEdgeBlackColumnStrip ??
      slugDefaults?.skipEdgeBlackColumnStrip ??
      manufacturerDefaults?.skipEdgeBlackColumnStrip ??
      false,
    skipEdgeBlackBottomRowStrip:
      options?.skipEdgeBlackBottomRowStrip ??
      slugDefaults?.skipEdgeBlackBottomRowStrip ??
      manufacturerDefaults?.skipEdgeBlackBottomRowStrip ??
      false,
    skipMatteSurround:
      options?.skipMatteSurround ??
      slugDefaults?.skipMatteSurround ??
      manufacturerDefaults?.skipMatteSurround ??
      false,
    skipTrimTransparentMargins:
      options?.skipTrimTransparentMargins ??
      slugDefaults?.skipTrimTransparentMargins ??
      manufacturerDefaults?.skipTrimTransparentMargins ??
      false,
    trimSurroundThreshold:
      options?.trimSurroundThreshold ??
      slugDefaults?.trimSurroundThreshold ??
      manufacturerDefaults?.trimSurroundThreshold ??
      0,
    stripSoftNearBlackAlphaMax:
      options?.stripSoftNearBlackAlphaMax ??
      slugDefaults?.stripSoftNearBlackAlphaMax ??
      manufacturerDefaults?.stripSoftNearBlackAlphaMax ??
      140,
    softenEdgeHalos:
      options?.softenEdgeHalos ??
      slugDefaults?.softenEdgeHalos ??
      manufacturerDefaults?.softenEdgeHalos ??
      false,
    rawLetterbox:
      options?.rawLetterbox ??
      slugDefaults?.rawLetterbox ??
      manufacturerDefaults?.rawLetterbox ??
      false,
  };
}

export function resolveLetterboxOptions(
  slug: string,
  manufacturerTag?: string,
  lightProcessingTags?: ReadonlySet<string>,
): Required<
  Pick<
    ProcessProductImageOptions,
    | "processingProfile"
    | "tileFillRatio"
    | "skipEdgeBlackStrip"
    | "skipEdgeBlackColumnStrip"
    | "skipEdgeBlackBottomRowStrip"
    | "skipMatteSurround"
    | "skipTrimTransparentMargins"
    | "trimSurroundThreshold"
    | "stripSoftNearBlackAlphaMax"
    | "softenEdgeHalos"
    | "rawLetterbox"
  >
> & { offsetX: number } {
  const resolved = resolveImageOptions({ slug, manufacturerTag });
  let processingProfile = resolved.processingProfile;
  if (
    processingProfile === "default" &&
    manufacturerTag &&
    lightProcessingTags?.has(manufacturerTag)
  ) {
    processingProfile = "light";
  }

  return {
    offsetX: IMAGE_PLACEMENT_OFFSETS[slug] ?? 0,
    processingProfile,
    tileFillRatio: resolved.tileFillRatio,
    skipEdgeBlackStrip: resolved.skipEdgeBlackStrip,
    skipEdgeBlackColumnStrip: resolved.skipEdgeBlackColumnStrip,
    skipEdgeBlackBottomRowStrip: resolved.skipEdgeBlackBottomRowStrip,
    skipMatteSurround: resolved.skipMatteSurround,
    skipTrimTransparentMargins: resolved.skipTrimTransparentMargins,
    trimSurroundThreshold: resolved.trimSurroundThreshold,
    stripSoftNearBlackAlphaMax: resolved.stripSoftNearBlackAlphaMax,
    softenEdgeHalos: resolved.softenEdgeHalos,
    rawLetterbox: resolved.rawLetterbox,
  };
}

function resolveWebpDir(options?: ProcessProductImageOptions): string {
  if (options?.webpDir) return options.webpDir;
  if (options?.manufacturerTag) {
    return productWebpDir(ROOT, options.manufacturerTag);
  }
  return DEFAULT_WEBP_DIR;
}

export async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PluginBargains/1.0)" },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (
      !contentType.includes("image") &&
      !/\.(avif|webp|png|jpe?g)(\?|$)/i.test(url)
    ) {
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Only trim rows that are almost entirely matte — avoids clipping box art. */
const MATTE_ROW_THRESHOLD = 0.92;
const EDGE_BLACK_ROW_THRESHOLD = 0.92;
const EDGE_BLACK_COL_THRESHOLD = 0.92;
const MIN_CROP_DIMENSION_RATIO = 0.5;

/** True when a pixel is removable matte (letterbox bars, white/gray surround). */
function isRemovableBackground(color: {
  r: number;
  g: number;
  b: number;
}): boolean {
  const { r, g, b } = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const avg = (r + g + b) / 3;

  if (max < 70 && max - min < 40) return true;
  if (min > 200 && max - min < 35) return true;
  if (avg > 165 && max - min < 35) return true;
  if (avg > 228 && avg < 248 && max - min < 15) return true;
  if (max < 95 && max - min < 20 && avg > 60 && avg < 100) return true;

  return false;
}

function isNearBlackLetterbox(color: {
  r: number;
  g: number;
  b: number;
}): boolean {
  const { r, g, b } = color;
  return Math.max(r, g, b) < 40;
}

/** Bundle gray / near-white surround that connects to image edges. */
function isBundleSurroundRemovable(color: {
  r: number;
  g: number;
  b: number;
}): boolean {
  const { r, g, b } = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const avg = (r + g + b) / 3;

  if (avg > 228 && avg < 248 && max - min < 15) return true;
  if (min > 240 && max - min < 10) return true;

  return false;
}

async function readCornerPixels(
  imageBuffer: Buffer,
): Promise<Array<{ r: number; g: number; b: number }>> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width = 0, height = 0, channels } = info;
  if (width < 2 || height < 2 || channels < 3) return [];

  const pixel = (x: number, y: number) => {
    const i = (y * width + x) * channels;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  };

  return [
    pixel(0, 0),
    pixel(width - 1, 0),
    pixel(0, height - 1),
    pixel(width - 1, height - 1),
  ];
}

async function tryTrimBackground(
  imageBuffer: Buffer,
  background: string | { r: number; g: number; b: number },
  threshold = 20,
): Promise<Buffer | null> {
  try {
    const trimmed = await sharp(imageBuffer)
      .trim({ background, threshold })
      .toBuffer();
    const before = await sharp(imageBuffer).metadata();
    const after = await sharp(trimmed).metadata();
    if (
      (after.width ?? 0) < (before.width ?? 0) * 0.98 ||
      (after.height ?? 0) < (before.height ?? 0) * 0.98
    ) {
      return trimmed;
    }
  } catch {
    // ignore
  }
  return null;
}

async function readRawRgba(
  imageBuffer: Buffer,
): Promise<{ data: Buffer; width: number; height: number; channels: number }> {
  const { data, info } = await sharp(imageBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width ?? 0,
    height: info.height ?? 0,
    channels: info.channels,
  };
}

function rowRemovableFraction(
  data: Buffer,
  width: number,
  channels: number,
  y: number,
): number {
  let matte = 0;
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * channels;
    if (isRemovableBackground({ r: data[i], g: data[i + 1], b: data[i + 2] })) {
      matte++;
    }
  }
  return matte / width;
}

/** Crop top/bottom matte rows only — column letterbox is keyed, not cropped. */
async function cropMatteRows(imageBuffer: Buffer): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (width < 2 || height < 2) return imageBuffer;

  let minY = 0;
  let maxY = height - 1;

  for (let y = 0; y < height; y++) {
    if (rowRemovableFraction(data, width, channels, y) < MATTE_ROW_THRESHOLD) {
      minY = y;
      break;
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    if (rowRemovableFraction(data, width, channels, y) < MATTE_ROW_THRESHOLD) {
      maxY = y;
      break;
    }
  }

  const cropHeight = maxY - minY + 1;
  if (
    cropHeight < height * MIN_CROP_DIMENSION_RATIO ||
    cropHeight === height
  ) {
    return imageBuffer;
  }

  return sharp(imageBuffer)
    .extract({ left: 0, top: minY, width, height: cropHeight })
    .toBuffer();
}

/** Key uniform near-black letterbox rows at the top and bottom edges. */
async function stripEdgeBlackRows(
  imageBuffer: Buffer,
  options?: { skipBottom?: boolean },
): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (width < 2 || height < 2 || channels < 4) return imageBuffer;

  let changed = false;

  const rowNearBlackFraction = (y: number): number => {
    let nearBlack = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (isNearBlackLetterbox({ r: data[i], g: data[i + 1], b: data[i + 2] })) {
        nearBlack++;
      }
    }
    return nearBlack / width;
  };

  for (let y = 0; y < height; y++) {
    if (rowNearBlackFraction(y) < EDGE_BLACK_ROW_THRESHOLD) break;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels + 3;
      if (data[i] === 0) continue;
      data[i] = 0;
      changed = true;
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    if (options?.skipBottom) break;
    if (rowNearBlackFraction(y) < EDGE_BLACK_ROW_THRESHOLD) break;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels + 3;
      if (data[i] === 0) continue;
      data[i] = 0;
      changed = true;
    }
  }

  if (!changed) return imageBuffer;

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Key uniform near-black letterbox columns at the left and right edges. */
async function stripEdgeBlackColumns(imageBuffer: Buffer): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (width < 2 || height < 2 || channels < 4) return imageBuffer;

  let changed = false;

  const columnNearBlackFraction = (x: number): number => {
    let nearBlack = 0;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * channels;
      if (isNearBlackLetterbox({ r: data[i], g: data[i + 1], b: data[i + 2] })) {
        nearBlack++;
      }
    }
    return nearBlack / height;
  };

  for (let x = 0; x < width; x++) {
    if (columnNearBlackFraction(x) < EDGE_BLACK_COL_THRESHOLD) break;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * channels + 3;
      if (data[i] === 0) continue;
      data[i] = 0;
      changed = true;
    }
  }

  for (let x = width - 1; x >= 0; x--) {
    if (columnNearBlackFraction(x) < EDGE_BLACK_COL_THRESHOLD) break;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * channels + 3;
      if (data[i] === 0) continue;
      data[i] = 0;
      changed = true;
    }
  }

  if (!changed) return imageBuffer;

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Gray/white studio backdrops only — not near-black plugin GUIs (edge flood-fill). */
function isMatteSurroundRemovable(color: {
  r: number;
  g: number;
  b: number;
}): boolean {
  const { r, g, b } = color;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const avg = (r + g + b) / 3;

  if (max < 70) return false;

  if (min > 200 && max - min < 35) return true;
  if (avg > 165 && max - min < 35) return true;
  if (avg > 228 && avg < 248 && max - min < 15) return true;
  if (avg > 140 && avg < 200 && max - min < 25) return true;

  return false;
}

/** Key matte gray / white / black surround connected to the image border. */
async function transparentizeMatteSurround(
  imageBuffer: Buffer,
): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (width < 2 || height < 2 || channels < 4) return imageBuffer;

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const keyed = new Uint8Array(pixelCount);
  const queue: number[] = [];

  const tryEnqueue = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (data[i + 3] === 0) return;
    if (
      !isMatteSurroundRemovable({ r: data[i], g: data[i + 1], b: data[i + 2] })
    ) {
      return;
    }
    visited[idx] = 1;
    keyed[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop()!;
    const x = idx % width;
    const y = (idx - x) / width;
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      tryEnqueue(nx, ny);
    }
  }

  let changed = false;
  for (let idx = 0; idx < pixelCount; idx++) {
    if (!keyed[idx]) continue;
    const i = idx * channels;
    if (data[i + 3] === 0) continue;
    data[i + 3] = 0;
    changed = true;
  }

  if (!changed) return imageBuffer;

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function countOpaqueFraction(imageBuffer: Buffer): Promise<number> {
  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  if (channels < 4) return 1;

  let opaque = 0;
  const total = info.width * info.height;
  for (let idx = 0; idx < total; idx++) {
    if (data[idx * channels + 3] > 128) opaque++;
  }
  return opaque / total;
}

async function transparentizeMatteSurroundSafe(
  imageBuffer: Buffer,
): Promise<Buffer> {
  const beforeOpaque = await countOpaqueFraction(imageBuffer);
  const keyed = await transparentizeMatteSurround(imageBuffer);
  if (keyed === imageBuffer) return imageBuffer;

  const afterOpaque = await countOpaqueFraction(keyed);
  // Full-bleed light GUIs are not letterbox surrounds — revert aggressive floods.
  if (afterOpaque < 0.4 || afterOpaque < beforeOpaque * 0.55) {
    return imageBuffer;
  }

  return keyed;
}

/** Key bundle gray / white surround connected to the image border. */
async function transparentizeBundleSurround(
  imageBuffer: Buffer,
): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (width < 2 || height < 2 || channels < 4) return imageBuffer;

  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const keyed = new Uint8Array(pixelCount);
  const queue: number[] = [];

  const tryEnqueue = (x: number, y: number) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * channels;
    if (data[i + 3] === 0) return;
    if (
      !isBundleSurroundRemovable({ r: data[i], g: data[i + 1], b: data[i + 2] })
    ) {
      return;
    }
    visited[idx] = 1;
    keyed[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop()!;
    const x = idx % width;
    const y = (idx - x) / width;
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      tryEnqueue(nx, ny);
    }
  }

  let changed = false;
  for (let idx = 0; idx < pixelCount; idx++) {
    if (!keyed[idx]) continue;
    const i = idx * channels;
    if (data[i + 3] === 0) continue;
    data[i + 3] = 0;
    changed = true;
  }

  if (!changed) return imageBuffer;

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Drop uniform square surround before letterbox (Softube grey-padded CDN shots). */
async function trimSurroundIfNeeded(
  imageBuffer: Buffer,
  threshold: number,
): Promise<Buffer> {
  if (!threshold) return imageBuffer;

  try {
    const trimmed = await sharp(imageBuffer).trim({ threshold }).toBuffer();
    const before = await sharp(imageBuffer).metadata();
    const after = await sharp(trimmed).metadata();
    if (
      (after.width ?? 0) < (before.width ?? 0) * 0.95 ||
      (after.height ?? 0) < (before.height ?? 0) * 0.95
    ) {
      return trimmed;
    }
  } catch {
    // keep original
  }

  return imageBuffer;
}

async function trimTransparentMargins(imageBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const stats = await sharp(imageBuffer).stats();
  const alphaMean = stats.channels[3]?.mean ?? 255;

  if (alphaMean < 220) {
    try {
      const trimmed = await sharp(imageBuffer).trim().toBuffer();
      const after = await sharp(trimmed).metadata();
      if (
        (after.width ?? 0) < (width || Number.MAX_SAFE_INTEGER) ||
        (after.height ?? 0) < (height || Number.MAX_SAFE_INTEGER)
      ) {
        return trimmed;
      }
    } catch {
      // keep original
    }
    return imageBuffer;
  }

  if (width > 0 && height > 0) {
    const aspect = width / height;
    // Square opaque product shots (e.g. Softube 1200×1200 thumbnails) — sharp trim
    // mistakes uniform surrounds for empty margins and crops to a thin strip.
    if (aspect > 0.85 && aspect < 1.15 && alphaMean > 250) {
      return imageBuffer;
    }
  }

  try {
    const trimmed = await sharp(imageBuffer).trim({ threshold: 12 }).toBuffer();
    const before = await sharp(imageBuffer).metadata();
    const after = await sharp(trimmed).metadata();
    if (
      (after.width ?? 0) < (before.width ?? 0) ||
      (after.height ?? 0) < (before.height ?? 0)
    ) {
      return trimmed;
    }
  } catch {
    // keep original
  }
  return imageBuffer;
}

/**
 * Strip removable backgrounds (transparent, white, gray, black letterbox) so
 * only the plugin GUI remains.
 */
async function stripRemovableBackground(
  imageBuffer: Buffer,
  profile: ImageProcessingProfile = "default",
  options?: {
    skipEdgeBlackStrip?: boolean;
    skipEdgeBlackColumnStrip?: boolean;
    skipEdgeBlackBottomRowStrip?: boolean;
    skipMatteSurround?: boolean;
    skipTrimTransparentMargins?: boolean;
    trimSurroundThreshold?: number;
    stripSoftNearBlackAlphaMax?: number;
  },
): Promise<Buffer> {
  let current = await trimSurroundIfNeeded(
    imageBuffer,
    options?.trimSurroundThreshold ?? 0,
  );
  current = options?.skipTrimTransparentMargins
    ? current
    : await trimTransparentMargins(current);

  if (profile === "default") {
    const corners = await readCornerPixels(current);
    const removableCorners = corners.filter(isRemovableBackground);

    if (removableCorners.length > 0) {
      for (let pass = 0; pass < 4; pass++) {
        const passCorners = await readCornerPixels(current);
        const passRemovable = passCorners.filter(isRemovableBackground);
        if (passRemovable.length === 0) break;

        const avg = passRemovable.reduce(
          (acc, c) => ({
            r: acc.r + c.r / passRemovable.length,
            g: acc.g + c.g / passRemovable.length,
            b: acc.b + c.b / passRemovable.length,
          }),
          { r: 0, g: 0, b: 0 },
        );
        const bg = {
          r: Math.round(avg.r),
          g: Math.round(avg.g),
          b: Math.round(avg.b),
        };

        const trimmed = await tryTrimBackground(current, bg, 24);
        if (!trimmed) break;
        current = trimmed;
      }
    }

    current = await cropMatteRows(current);
    current = await stripEdgeBlackRows(current);
    current = await stripEdgeBlackColumns(current);
    current = await transparentizeBundleSurround(current);
  } else {
    if (!options?.skipEdgeBlackStrip) {
      current = await stripEdgeBlackRows(current, {
        skipBottom: options?.skipEdgeBlackBottomRowStrip,
      });
      if (!options?.skipEdgeBlackColumnStrip) {
        current = await stripEdgeBlackColumns(current);
      }
      current = await stripSoftNearBlackAlpha(
        current,
        options?.stripSoftNearBlackAlphaMax ?? 140,
      );
    }
    if (!options?.skipMatteSurround) {
      current = await transparentizeMatteSurroundSafe(current);
    }
  }

  if (!options?.skipTrimTransparentMargins) {
    current = await trimTransparentMargins(current);
  }

  return toAlphaPng(current);
}

/** Drop semi-transparent near-black letterbox remnants before resize. */
async function stripSoftNearBlackAlpha(
  imageBuffer: Buffer,
  maxAlpha = 140,
): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (channels < 4) return imageBuffer;

  let changed = false;
  for (let idx = 0; idx < width * height; idx++) {
    const i = idx * channels;
    const alpha = data[i + 3];
    if (alpha === 0 || alpha === 255) continue;

    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    if (alpha < maxAlpha && max < 45) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      changed = true;
    }
  }

  if (!changed) return imageBuffer;

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Smudge grey/red resize halos on bundle edges — keeps soft anti-aliasing. */
async function softenBundleCollageFringe(
  imageBuffer: Buffer,
): Promise<Buffer> {
  const blurred = await sharp(imageBuffer).blur(0.65).png().toBuffer();
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  const { data: blurData } = await readRawRgba(blurred);
  if (width < 4 || height < 4 || channels < 4) return imageBuffer;

  const isTransparent = (x: number, y: number) =>
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height ||
    data[(y * width + x) * channels + 3] < 16;

  const bordersTransparency = (x: number, y: number) =>
    isTransparent(x, y + 1) ||
    isTransparent(x, y - 1) ||
    isTransparent(x - 1, y) ||
    isTransparent(x + 1, y);

  let changed = false;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const alpha = data[i + 3];
      if (alpha < 16) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const avg = (r + g + b) / 3;
      const isGoldChrome = r > 130 && g > 80 && b < 90 && r >= g;
      const isRedShadow =
        alpha < 230 && r > g + 18 && r > b + 18 && g < 90 && b < 90;

      if (isRedShadow && bordersTransparency(x, y)) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
        changed = true;
        continue;
      }

      if (isGoldChrome) continue;

      const isGreyFringe =
        alpha < 252 && bordersTransparency(x, y) && avg < 140;
      if (!isGreyFringe) continue;

      const blend = Math.min(0.7, ((252 - alpha) / 120) * 0.5 + 0.22);
      data[i] = Math.round(data[i] * (1 - blend) + blurData[i] * blend);
      data[i + 1] = Math.round(
        data[i + 1] * (1 - blend) + blurData[i + 1] * blend,
      );
      data[i + 2] = Math.round(
        data[i + 2] * (1 - blend) + blurData[i + 2] * blend,
      );
      changed = true;
    }
  }

  for (let idx = 0; idx < width * height; idx++) {
    const i = idx * channels;
    if (data[i + 3] < 16) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
    }
  }

  if (!changed) return imageBuffer;

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/** Remove matte halos and resize fringe only on pixels bordering transparency. */
async function cleanAlphaFringe(imageBuffer: Buffer): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (channels < 4) return imageBuffer;

  const pixelCount = width * height;
  const alphaAt = (idx: number) => data[idx * channels + 3];
  const isTransparent = (idx: number) => alphaAt(idx) < 16;
  const isFringe = new Uint8Array(pixelCount);

  for (let idx = 0; idx < pixelCount; idx++) {
    const alpha = alphaAt(idx);
    if (alpha >= 245 || alpha < 16) continue;

    const x = idx % width;
    const y = (idx - x) / width;
    const neighbors: Array<[number, number]> = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (isTransparent(ny * width + nx)) {
        isFringe[idx] = 1;
        break;
      }
    }
  }

  for (let idx = 0; idx < pixelCount; idx++) {
    const i = idx * channels;
    const alpha = data[i + 3];

    if (alpha < 16) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }

    if (!isFringe[idx]) continue;

    const color = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const avg = (color.r + color.g + color.b) / 3;

    if (isMatteSurroundRemovable(color) || avg < 25) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }

    data[i + 3] = 255;
  }

  return sharp(data, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * Place the plugin GUI on a square tile like Waves: contain fit, transparent
 * letterbox padding — no cropping, no baked background color.
 */
export async function letterboxToSquareWebp(
  imageBuffer: Buffer,
  webpPath: string,
  options?: {
    size?: number;
    offsetX?: number;
    processingProfile?: ImageProcessingProfile;
    tileFillRatio?: number;
    skipEdgeBlackStrip?: boolean;
    skipEdgeBlackColumnStrip?: boolean;
    skipEdgeBlackBottomRowStrip?: boolean;
    skipMatteSurround?: boolean;
    skipTrimTransparentMargins?: boolean;
    trimSurroundThreshold?: number;
    stripSoftNearBlackAlphaMax?: number;
    softenEdgeHalos?: boolean;
    rawLetterbox?: boolean;
  },
): Promise<void> {
  const size = options?.size ?? WEBP_SIZE;
  const offsetX = options?.offsetX ?? 0;
  const tileFillRatio = options?.tileFillRatio ?? TILE_FILL_RATIO;
  let prepared: Buffer;
  if (options?.rawLetterbox) {
    prepared = await toAlphaPng(imageBuffer);
  } else {
    const beforeOpaque = await countOpaqueFraction(imageBuffer);
    prepared = await stripRemovableBackground(
      imageBuffer,
      options?.processingProfile ?? "default",
      {
        skipEdgeBlackStrip: options?.skipEdgeBlackStrip,
        skipEdgeBlackColumnStrip: options?.skipEdgeBlackColumnStrip,
        skipEdgeBlackBottomRowStrip: options?.skipEdgeBlackBottomRowStrip,
        skipMatteSurround: options?.skipMatteSurround,
        skipTrimTransparentMargins: options?.skipTrimTransparentMargins,
        trimSurroundThreshold: options?.trimSurroundThreshold,
        stripSoftNearBlackAlphaMax: options?.stripSoftNearBlackAlphaMax,
      },
    );
    if ((await countOpaqueFraction(prepared)) < beforeOpaque * 0.8) {
      prepared = await toAlphaPng(imageBuffer);
    }
  }
  const innerMax = Math.round(size * tileFillRatio);

  const resized = await sharp(prepared)
    .resize(innerMax, innerMax, {
      fit: "contain",
      background: TRANSPARENT,
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
  const resizedOpaque = await countOpaqueFraction(resized);

  let fitted: Buffer;
  if (options?.rawLetterbox) {
    fitted = resized;
  } else if (options?.softenEdgeHalos) {
    fitted = await softenBundleCollageFringe(resized);
  } else {
    fitted = await cleanAlphaFringe(resized);
    if ((await countOpaqueFraction(fitted)) < resizedOpaque * 0.85) {
      fitted = resized;
    }
  }

  const { width = innerMax, height = innerMax } = await sharp(fitted).metadata();
  const padLeft = Math.max(0, Math.floor((size - width) / 2) + offsetX);
  const padTop = Math.floor((size - height) / 2);

  await sharp(fitted)
    .extend({
      top: padTop,
      bottom: size - height - padTop,
      left: padLeft,
      right: Math.max(0, size - width - padLeft),
      background: TRANSPARENT,
    })
    .webp({ quality: 85 })
    .toFile(webpPath);
}

export async function processProductImageFromBuffer(
  slug: string,
  imageBuffer: Buffer,
  options?: ProcessProductImageOptions,
): Promise<boolean> {
  const webpDir = resolveWebpDir(options);

  await fs.mkdir(webpDir, { recursive: true });

  const webpPath = path.join(webpDir, `${slug}.webp`);

  const resolved = resolveImageOptions({ ...options, slug });
  await letterboxToSquareWebp(imageBuffer, webpPath, {
    offsetX: IMAGE_PLACEMENT_OFFSETS[slug] ?? 0,
    processingProfile: resolved.processingProfile,
    tileFillRatio: resolved.tileFillRatio,
    skipEdgeBlackStrip: resolved.skipEdgeBlackStrip,
    skipEdgeBlackColumnStrip: resolved.skipEdgeBlackColumnStrip,
    skipEdgeBlackBottomRowStrip: resolved.skipEdgeBlackBottomRowStrip,
    skipMatteSurround: resolved.skipMatteSurround,
    skipTrimTransparentMargins: resolved.skipTrimTransparentMargins,
    trimSurroundThreshold: resolved.trimSurroundThreshold,
    stripSoftNearBlackAlphaMax: resolved.stripSoftNearBlackAlphaMax,
    softenEdgeHalos: resolved.softenEdgeHalos,
    rawLetterbox: resolved.rawLetterbox,
  });

  return true;
}

export async function processProductImageFromUrls(
  slug: string,
  urls: string[],
  options?: ProcessProductImageOptions,
): Promise<boolean> {
  let imageBuffer: Buffer | null = null;
  for (const url of urls) {
    imageBuffer = await downloadImage(url);
    if (imageBuffer) break;
  }

  if (!imageBuffer) {
    console.warn(`  ✗ No image for ${slug}`);
    return false;
  }

  return processProductImageFromBuffer(slug, imageBuffer, options);
}
