/**
 * Re-process product WebPs from originals using the Waves-style tile treatment.
 *
 * Run: npm run reprocess:catalog-images
 * Optional: npm run reprocess:catalog-images -- waves fabfilter
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  productOriginalDir,
  productWebpDir,
} from "../lib/catalog/product-image-path";
import {
  IMAGE_PLACEMENT_OFFSETS,
  letterboxToSquareWebp,
  MANUFACTURER_IMAGE_OPTIONS,
  type ImageProcessingProfile,
} from "./lib/process-product-image";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const CATALOG_MANUFACTURERS: Record<string, string> = {
  soundtoys: "soundtoys",
  waves: "waves",
  "plugin-alliance": "plugin-alliance",
  uad: "universal-audio",
  mcdsp: "mcdsp",
  fabfilter: "fabfilter",
  izotope: "izotope",
  sonnox: "sonnox",
  softube: "softube",
  ssl: "solid-state-logic",
  slate: "slate-digital",
  eventide: "eventide",
  xln: "xln-audio",
  relab: "relab-development",
  antares: "antares",
  output: "output",
  "baby-audio": "baby-audio",
};

const CATALOG_FILES: Record<string, string> = {
  waves: "lib/catalog/waves-products.ts",
  "plugin-alliance": "lib/catalog/plugin-alliance-products.ts",
  uad: "lib/catalog/uad-products.ts",
  mcdsp: "lib/catalog/mcdsp-products.ts",
  fabfilter: "lib/catalog/fabfilter-products.ts",
  izotope: "lib/catalog/izotope-products.ts",
  sonnox: "lib/catalog/sonnox-products.ts",
  softube: "lib/catalog/softube-products.ts",
  ssl: "lib/catalog/ssl-products.ts",
  slate: "lib/catalog/slate-products.ts",
  eventide: "lib/catalog/eventide-products.ts",
  "newfangled-audio": "lib/catalog/newfangled-audio-products.ts",
  xln: "lib/catalog/xln-products.ts",
  relab: "lib/catalog/relab-products.ts",
  antares: "lib/catalog/antares-products.ts",
  output: "lib/catalog/output-products.ts",
  "baby-audio": "lib/catalog/baby-audio-products.ts",
};

const LIGHT_PROCESSING_TAGS = new Set([
  "universal-audio",
  "softube",
  "solid-state-logic",
  "sonnox",
  "fabfilter",
  "slate-digital",
  "izotope",
  "eventide",
]);

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
];

type ReprocessEntry = { slug: string; manufacturerTag: string };

function slugsFromCatalogFile(content: string): string[] {
  return [...content.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
}

async function reprocessEntry(entry: ReprocessEntry): Promise<boolean> {
  const originalPath = path.join(
    productOriginalDir(ROOT, entry.manufacturerTag),
    `${entry.slug}.png`,
  );
  const webpDir = productWebpDir(ROOT, entry.manufacturerTag);
  const webpPath = path.join(webpDir, `${entry.slug}.webp`);

  try {
    const buffer = await fs.readFile(originalPath);
    await fs.mkdir(webpDir, { recursive: true });
    const manufacturerDefaults =
      MANUFACTURER_IMAGE_OPTIONS[entry.manufacturerTag];
    const processingProfile: ImageProcessingProfile =
      manufacturerDefaults?.processingProfile ??
      (LIGHT_PROCESSING_TAGS.has(entry.manufacturerTag) ? "light" : "default");

    await letterboxToSquareWebp(buffer, webpPath, {
      offsetX: IMAGE_PLACEMENT_OFFSETS[entry.slug] ?? 0,
      processingProfile,
      tileFillRatio: manufacturerDefaults?.tileFillRatio,
      skipEdgeBlackStrip: manufacturerDefaults?.skipEdgeBlackStrip,
    });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const selected = process.argv.slice(2);
  const keys =
    selected.length > 0
      ? selected.filter((k) => k in CATALOG_MANUFACTURERS)
      : Object.keys(CATALOG_MANUFACTURERS);

  const entries: ReprocessEntry[] = [];

  for (const key of keys) {
    const manufacturerTag = CATALOG_MANUFACTURERS[key];

    if (key === "soundtoys") {
      for (const slug of SOUNDTOYS_SLUGS) {
        entries.push({ slug, manufacturerTag });
      }
      continue;
    }

    const catalogFile = CATALOG_FILES[key];
    if (!catalogFile) continue;

    const filePath = path.join(ROOT, catalogFile);
    const content = await fs.readFile(filePath, "utf8");
    for (const slug of slugsFromCatalogFile(content)) {
      entries.push({ slug, manufacturerTag });
    }
  }

  console.log(`Reprocessing ${entries.length} product images...`);

  let ok = 0;
  let missing = 0;

  for (const entry of entries.sort((a, b) => a.slug.localeCompare(b.slug))) {
    if (await reprocessEntry(entry)) {
      ok++;
    } else {
      missing++;
      console.warn(`  ✗ missing original: ${entry.slug}.png`);
    }
  }

  console.log(`Done: ${ok} reprocessed, ${missing} missing originals`);
  if (missing > 0) {
    console.warn("Some originals are missing — re-run the relevant build:*-catalog script.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
