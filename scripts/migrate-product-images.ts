/**
 * One-time migration: move flat product WebPs into manufacturer subfolders.
 *
 * Run: npx tsx scripts/migrate-product-images.ts
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { productWebpDir } from "../lib/catalog/product-image-fs";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const PRODUCTS_DIR = path.join(ROOT, "public/images/products");

const CATALOG_MANUFACTURERS: Record<string, string> = {
  "lib/catalog/waves-products.ts": "waves",
  "lib/catalog/plugin-alliance-products.ts": "plugin-alliance",
  "lib/catalog/uad-products.ts": "universal-audio",
  "lib/catalog/mcdsp-products.ts": "mcdsp",
  "lib/catalog/fabfilter-products.ts": "fabfilter",
  "lib/catalog/izotope-products.ts": "izotope",
  "lib/catalog/sonnox-products.ts": "sonnox",
  "lib/catalog/softube-products.ts": "softube",
  "lib/catalog/ssl-products.ts": "solid-state-logic",
  "lib/catalog/slate-products.ts": "slate-digital",
  "lib/catalog/eventide-products.ts": "eventide",
  "lib/catalog/xln-products.ts": "xln-audio",
  "lib/catalog/relab-products.ts": "relab-development",
  "lib/catalog/antares-products.ts": "antares",
  "lib/catalog/baby-audio-products.ts": "baby-audio",
};

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

function slugsFromCatalog(content: string): string[] {
  return [...content.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
}

async function moveFile(
  oldPath: string,
  newPath: string,
): Promise<"moved" | "exists" | "missing"> {
  await fs.mkdir(path.dirname(newPath), { recursive: true });

  try {
    await fs.access(newPath);
    return "exists";
  } catch {
    // not in destination yet
  }

  try {
    await fs.rename(oldPath, newPath);
    return "moved";
  } catch {
    return "missing";
  }
}

async function moveWebp(
  slug: string,
  manufacturerTag: string,
): Promise<"moved" | "exists" | "missing"> {
  return moveFile(
    path.join(PRODUCTS_DIR, `${slug}.webp`),
    path.join(productWebpDir(ROOT, manufacturerTag), `${slug}.webp`),
  );
}

async function updateCatalogPaths(
  catalogFile: string,
  manufacturerTag: string,
): Promise<void> {
  const filePath = path.join(ROOT, catalogFile);
  const content = await fs.readFile(filePath, "utf8");
  const prefix = `/images/products/${manufacturerTag}/`;

  const updated = content.replace(
    /image: "\/images\/products\/([^"/]+)\.webp"/g,
    (match, slug: string) => {
      if (slug.includes("/")) return match;
      return `image: "${prefix}${slug}.webp"`;
    },
  );

  if (updated !== content) {
    await fs.writeFile(filePath, updated, "utf8");
  }
}

async function updateSeedSoundtoys(): Promise<void> {
  const seedPath = path.join(ROOT, "lib/seed.ts");
  const content = await fs.readFile(seedPath, "utf8");
  const updated = content.replace(
    /image: "\/images\/products\/([^"/]+)\.webp"/g,
    (match, slug: string) => {
      if (slug.includes("/")) return match;
      return `image: "/images/products/soundtoys/${slug}.webp"`;
    },
  );

  if (updated !== content) {
    await fs.writeFile(seedPath, updated, "utf8");
  }
}

async function migrateManufacturerFiles(): Promise<void> {
  let moved = 0;
  let exists = 0;
  let missing = 0;

  for (const [catalogFile, manufacturerTag] of Object.entries(
    CATALOG_MANUFACTURERS,
  )) {
    const content = await fs.readFile(path.join(ROOT, catalogFile), "utf8");
    const slugs = slugsFromCatalog(content);

    for (const slug of slugs) {
      const result = await moveWebp(slug, manufacturerTag);
      if (result === "moved") moved++;
      else if (result === "exists") exists++;
      else missing++;
    }

    await updateCatalogPaths(catalogFile, manufacturerTag);
    console.log(`Updated ${catalogFile} → ${manufacturerTag}/`);
  }

  for (const slug of SOUNDTOYS_SLUGS) {
    const result = await moveWebp(slug, "soundtoys");
    if (result === "moved") moved++;
    else if (result === "exists") exists++;
    else missing++;
  }

  await updateSeedSoundtoys();
  console.log("Updated lib/seed.ts → soundtoys/");

  console.log(
    `webp: ${moved} moved, ${exists} already in place, ${missing} missing`,
  );
}

async function main(): Promise<void> {
  await migrateManufacturerFiles();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
