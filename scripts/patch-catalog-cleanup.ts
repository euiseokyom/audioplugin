/**
 * One-shot catalog cleanup: waves/softube/ssl pruning, PA vendor split, Baby Audio names.
 * Run: npx tsx scripts/patch-catalog-cleanup.ts
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { WAVES_NOT_INDIVIDUALLY_SOLD } from "../lib/catalog/waves-not-individually-sold";
import {
  PA_VENDOR_TO_MANUFACTURER,
  shouldExcludeFromPluginAllianceCatalog,
} from "../lib/catalog/pa-vendor-manufacturers";
import { WAVES_PRODUCTS } from "../lib/catalog/waves-products";
import { SOFTUBE_PRODUCTS } from "../lib/catalog/softube-products";
import { SSL_PRODUCTS } from "../lib/catalog/ssl-products";
import { PLUGIN_ALLIANCE_PRODUCTS } from "../lib/catalog/plugin-alliance-products";
import { BABY_AUDIO_PRODUCTS } from "../lib/catalog/baby-audio-products";
import type { SeedProduct } from "../lib/catalog/seed-product";
import { serializeCatalogProducts } from "./lib/shopify-catalog";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const SOFTUBE_SKIP_SLUGS = new Set([
  "chandler-limited-zener-bender",
  "deesser",
  "delay-modulation",
  "modular-exclusive",
  "modular-ready",
  "plug-in-collections",
  "reverb-room",
  "special-processing",
  "synthesizers",
  "tape-saturation",
  "vocals-pitch-correction",
  "fix-doubler",
]);

const BABY_AUDIO_NAMES: Record<string, string> = {
  taip: "TAIP",
  "parallel-aggressor": "Parallel Aggressor",
  "comeback-kid-delay": "Comeback Kid",
  "ihny-2": "I Heart NY 2",
  "smooth-operator": "Smooth Operator",
  "spaced-out": "Spaced Out",
  "super-vhs-multi-fx": "Super VHS",
  crystalline: "Crystalline",
  humanoid: "Humanoid",
  grainferno: "Grainferno",
  atoms: "Atoms",
  "ba-1": "BA-1",
  tekno: "Tekno",
  transit: "Transit",
  "complete-bundle": "Complete Bundle",
};

const BABY_AUDIO_PRICES: Record<string, number> = {
  taip: 69,
  "parallel-aggressor": 49,
  "comeback-kid-delay": 49,
  "ihny-2": 49,
  "smooth-operator": 49,
  "spaced-out": 49,
  "super-vhs-multi-fx": 49,
  crystalline: 69,
  humanoid: 49,
  grainferno: 59,
  atoms: 59,
  "ba-1": 69,
  tekno: 89,
  transit: 69,
  "complete-bundle": 199,
};

async function writeCatalog(
  relativePath: string,
  products: SeedProduct[],
  exportName: string,
) {
  const output = serializeCatalogProducts(products, {
    exportName,
    generatedBy: "scripts/patch-catalog-cleanup.ts",
  });
  await fs.writeFile(path.join(ROOT, relativePath), output, "utf8");
  console.log(`Wrote ${products.length} products → ${relativePath}`);
}

function patchPluginAlliance(products: SeedProduct[]): SeedProduct[] {
  return products
    .filter((p) => !shouldExcludeFromPluginAllianceCatalog(p.tags))
    .map((p) => {
      const vendorTag = p.tags.find((tag) => PA_VENDOR_TO_MANUFACTURER[tag]);
      if (!vendorTag) return p;
      return {
        ...p,
        manufacturer: PA_VENDOR_TO_MANUFACTURER[vendorTag],
      };
    });
}

function patchBabyAudio(products: SeedProduct[]): SeedProduct[] {
  return products
    .filter((p) => p.slug !== "all-products")
    .map((p) => ({
      ...p,
      name: BABY_AUDIO_NAMES[p.slug] ?? p.name.replace(/^₩[\d,]+$/, p.slug),
      registeredPrice: BABY_AUDIO_PRICES[p.slug] ?? p.registeredPrice,
    }))
    .filter((p) => !/^₩/.test(p.name));
}

async function main() {
  const waves = WAVES_PRODUCTS.filter(
    (p) => !WAVES_NOT_INDIVIDUALLY_SOLD.has(p.slug),
  );
  const softube = SOFTUBE_PRODUCTS.filter(
    (p) => !SOFTUBE_SKIP_SLUGS.has(p.slug),
  );
  const ssl = SSL_PRODUCTS.filter(
    (p) => !p.name.startsWith("Harrison ") && !p.slug.startsWith("harrison-"),
  );
  const pluginAlliance = patchPluginAlliance(PLUGIN_ALLIANCE_PRODUCTS);
  const babyAudio = patchBabyAudio(BABY_AUDIO_PRODUCTS);

  await writeCatalog(
    "lib/catalog/waves-products.ts",
    waves,
    "WAVES_PRODUCTS",
  );
  await writeCatalog(
    "lib/catalog/softube-products.ts",
    softube,
    "SOFTUBE_PRODUCTS",
  );
  await writeCatalog("lib/catalog/ssl-products.ts", ssl, "SSL_PRODUCTS");
  await writeCatalog(
    "lib/catalog/plugin-alliance-products.ts",
    pluginAlliance,
    "PLUGIN_ALLIANCE_PRODUCTS",
  );
  await writeCatalog(
    "lib/catalog/baby-audio-products.ts",
    babyAudio,
    "BABY_AUDIO_PRODUCTS",
  );

  console.log("Catalog cleanup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
