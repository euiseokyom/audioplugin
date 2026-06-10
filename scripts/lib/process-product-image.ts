import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import {
  productOriginalDir,
  productWebpDir,
} from "../../lib/catalog/product-image-fs";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

export const WEBP_SIZE = 365;

/** Max fraction of the tile the GUI may occupy (transparent margin on all sides). */
const TILE_FILL_RATIO = 0.95;

/** Horizontal nudge in pixels (positive = shift right) for specific product tiles. */
export const IMAGE_PLACEMENT_OFFSETS: Record<string, number> = {
  "soundtoys-5": 40,
};

/** Per-manufacturer tile fit and background handling overrides. */
export const MANUFACTURER_IMAGE_OPTIONS: Record<
  string,
  {
    processingProfile?: ImageProcessingProfile;
    tileFillRatio?: number;
    skipEdgeBlackStrip?: boolean;
  }
> = {
  eventide: {
    processingProfile: "light",
    tileFillRatio: 0.98,
    skipEdgeBlackStrip: true,
  },
};

/** Transparent letterbox — card CSS (bg-base-300) shows through, like Waves. */
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 } as const;

export const DEFAULT_ORIGINAL_DIR = path.join(
  ROOT,
  "public/images/products/original",
);
export const DEFAULT_WEBP_DIR = path.join(ROOT, "public/images/products");

export type ImageProcessingProfile = "default" | "light";

export type ProcessProductImageOptions = {
  originalDir?: string;
  webpDir?: string;
  manufacturerTag?: string;
  /** Light: key letterbox only — no geometric crop from matte detection. */
  processingProfile?: ImageProcessingProfile;
  /** Fraction of the tile the GUI may occupy (default 0.95). */
  tileFillRatio?: number;
  /** Skip near-black edge row/column stripping (full-bleed product art). */
  skipEdgeBlackStrip?: boolean;
};

function resolveImageOptions(
  options?: ProcessProductImageOptions,
): Required<
  Pick<
    ProcessProductImageOptions,
    "processingProfile" | "tileFillRatio" | "skipEdgeBlackStrip"
  >
> {
  const manufacturerDefaults = options?.manufacturerTag
    ? MANUFACTURER_IMAGE_OPTIONS[options.manufacturerTag]
    : undefined;

  return {
    processingProfile:
      options?.processingProfile ??
      manufacturerDefaults?.processingProfile ??
      "default",
    tileFillRatio:
      options?.tileFillRatio ?? manufacturerDefaults?.tileFillRatio ?? TILE_FILL_RATIO,
    skipEdgeBlackStrip:
      options?.skipEdgeBlackStrip ??
      manufacturerDefaults?.skipEdgeBlackStrip ??
      false,
  };
}

function resolveWebpDir(options?: ProcessProductImageOptions): string {
  if (options?.webpDir) return options.webpDir;
  if (options?.manufacturerTag) {
    return productWebpDir(ROOT, options.manufacturerTag);
  }
  return DEFAULT_WEBP_DIR;
}

function resolveOriginalDir(options?: ProcessProductImageOptions): string {
  if (options?.originalDir) return options.originalDir;
  if (options?.manufacturerTag) {
    return productOriginalDir(ROOT, options.manufacturerTag);
  }
  return DEFAULT_ORIGINAL_DIR;
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
async function stripEdgeBlackRows(imageBuffer: Buffer): Promise<Buffer> {
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

async function transparentizeMatteSurroundSafe(
  imageBuffer: Buffer,
): Promise<Buffer> {
  const keyed = await transparentizeMatteSurround(imageBuffer);
  if (keyed === imageBuffer) return imageBuffer;

  const { data, info } = await sharp(keyed)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  let opaque = 0;
  const total = info.width * info.height;
  for (let idx = 0; idx < total; idx++) {
    if (data[idx * channels + 3] > 128) opaque++;
  }
  if (opaque / total < 0.02) return imageBuffer;

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
  options?: { skipEdgeBlackStrip?: boolean },
): Promise<Buffer> {
  let current = await trimTransparentMargins(imageBuffer);

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
      current = await stripEdgeBlackRows(current);
      current = await stripEdgeBlackColumns(current);
      current = await stripSoftNearBlackAlpha(current);
    }
    current = await transparentizeMatteSurroundSafe(current);
  }

  current = await trimTransparentMargins(current);

  return sharp(current).ensureAlpha().toBuffer();
}

/** Drop semi-transparent near-black letterbox remnants before resize. */
async function stripSoftNearBlackAlpha(imageBuffer: Buffer): Promise<Buffer> {
  const { data, width, height, channels } = await readRawRgba(imageBuffer);
  if (channels < 4) return imageBuffer;

  let changed = false;
  for (let idx = 0; idx < width * height; idx++) {
    const i = idx * channels;
    const alpha = data[i + 3];
    if (alpha === 0 || alpha === 255) continue;

    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    if (alpha < 140 && max < 45) {
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

    if (isMatteSurroundRemovable(color) || avg > 210 || avg < 25) {
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
  },
): Promise<void> {
  const size = options?.size ?? WEBP_SIZE;
  const offsetX = options?.offsetX ?? 0;
  const tileFillRatio = options?.tileFillRatio ?? TILE_FILL_RATIO;
  const prepared = await stripRemovableBackground(
    imageBuffer,
    options?.processingProfile ?? "default",
    { skipEdgeBlackStrip: options?.skipEdgeBlackStrip },
  );
  const innerMax = Math.round(size * tileFillRatio);

  const fitted = await cleanAlphaFringe(
    await sharp(prepared)
      .resize(innerMax, innerMax, {
        fit: "contain",
        background: TRANSPARENT,
        kernel: sharp.kernel.lanczos3,
      })
      .toBuffer(),
  );

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
  const originalDir = resolveOriginalDir(options);
  const webpDir = resolveWebpDir(options);

  await fs.mkdir(originalDir, { recursive: true });
  await fs.mkdir(webpDir, { recursive: true });

  const originalPath = path.join(originalDir, `${slug}.png`);
  const webpPath = path.join(webpDir, `${slug}.webp`);

  await fs.writeFile(originalPath, imageBuffer);
  const resolved = resolveImageOptions(options);
  await letterboxToSquareWebp(imageBuffer, webpPath, {
    offsetX: IMAGE_PLACEMENT_OFFSETS[slug] ?? 0,
    processingProfile: resolved.processingProfile,
    tileFillRatio: resolved.tileFillRatio,
    skipEdgeBlackStrip: resolved.skipEdgeBlackStrip,
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
