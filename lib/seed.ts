/**
 * Run with: npx ts-node --project tsconfig.json lib/seed.ts
 * Or via: npm run seed
 */

import mongoose from "mongoose";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import { FABFILTER_PRODUCTS } from "@/lib/catalog/fabfilter-products";
import { IZOTOPE_PRODUCTS } from "@/lib/catalog/izotope-products";
import { MCDSP_PRODUCTS } from "@/lib/catalog/mcdsp-products";
import { SLATE_PRODUCTS } from "@/lib/catalog/slate-products";
import { EVENTIDE_PRODUCTS } from "@/lib/catalog/eventide-products";
import { NEWFANGLED_AUDIO_PRODUCTS } from "@/lib/catalog/newfangled-audio-products";
import { XLN_PRODUCTS } from "@/lib/catalog/xln-products";
import { RELAB_PRODUCTS } from "@/lib/catalog/relab-products";
import { ANTARES_PRODUCTS } from "@/lib/catalog/antares-products";
import { BABY_AUDIO_PRODUCTS } from "@/lib/catalog/baby-audio-products";
import { SOFTUBE_PRODUCTS } from "@/lib/catalog/softube-products";
import { SONNOX_PRODUCTS } from "@/lib/catalog/sonnox-products";
import { SSL_PRODUCTS } from "@/lib/catalog/ssl-products";
import { PLUGIN_ALLIANCE_PRODUCTS } from "@/lib/catalog/plugin-alliance-products";
import { UAD_PRODUCTS } from "@/lib/catalog/uad-products";
import { WAVES_PRODUCTS } from "@/lib/catalog/waves-products";
import type { SeedProduct } from "@/lib/catalog/seed-product";
import { resolveProductImageSrc } from "@/lib/catalog/product-image-path";
import {
  ensureUniqueSlug,
  warnCatalogSlugCollisions,
} from "@/lib/catalog/slug-utils";
import { getEndsSoonDealEndDate } from "@/lib/ends-soon";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/audioplugin";

const BASE_PRODUCTS: SeedProduct[] = [
  {
    name: "Soundtoys 5",
    slug: "soundtoys-5",
    canonicalId: "soundtoys-5-soundtoys",
    image: "/images/products/soundtoys/soundtoys-5.webp",
    category: "Bundle",
    manufacturer: "Soundtoys",
    registeredPrice: 599,
    tags: ["bundle", "effects", "saturation", "delay"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Decapitator",
    slug: "decapitator",
    canonicalId: "decapitator-soundtoys",
    image: "/images/products/soundtoys/decapitator.webp",
    category: "Saturation",
    manufacturer: "Soundtoys",
    registeredPrice: 199,
    tags: ["saturation", "analog"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "EchoBoy",
    slug: "echoboy",
    canonicalId: "echoboy-soundtoys",
    image: "/images/products/soundtoys/echoboy.webp",
    category: "Delay",
    manufacturer: "Soundtoys",
    registeredPrice: 199,
    tags: ["delay", "analog"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Sie-Q",
    slug: "sie-q",
    canonicalId: "sie-q-soundtoys",
    image: "/images/products/soundtoys/sie-q.webp",
    category: "Equalizer",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["equalizer", "analog"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Devil-Loc Deluxe",
    slug: "devil-loc-deluxe",
    canonicalId: "devil-loc-deluxe-soundtoys",
    image: "/images/products/soundtoys/devil-loc-deluxe.webp",
    category: "Saturation",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["saturation", "compressor"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "MicroShift",
    slug: "microshift",
    canonicalId: "microshift-soundtoys",
    image: "/images/products/soundtoys/microshift.webp",
    category: "Effects",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["pitch-shift", "chorus", "modulation"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Crystallizer",
    slug: "crystallizer",
    canonicalId: "crystallizer-soundtoys",
    image: "/images/products/soundtoys/crystallizer.webp",
    category: "Delay",
    manufacturer: "Soundtoys",
    registeredPrice: 149,
    tags: ["pitch-shift", "experimental", "modulation"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "PhaseMistress",
    slug: "phasemistress",
    canonicalId: "phasemistress-soundtoys",
    image: "/images/products/soundtoys/phasemistress.webp",
    category: "Effects",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["phaser", "modulation"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Tremolator",
    slug: "tremolator",
    canonicalId: "tremolator-soundtoys",
    image: "/images/products/soundtoys/tremolator.webp",
    category: "Effects",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["tremolo", "modulation"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "FilterFreak",
    slug: "filterfreak",
    canonicalId: "filterfreak-soundtoys",
    image: "/images/products/soundtoys/filterfreak.webp",
    category: "Equalizer",
    manufacturer: "Soundtoys",
    registeredPrice: 149,
    tags: ["filter", "analog"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "PrimalTap",
    slug: "primaltap",
    canonicalId: "primaltap-soundtoys",
    image: "/images/products/soundtoys/primaltap.webp",
    category: "Delay",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["delay", "pitch", "analog"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Radiator",
    slug: "radiator",
    canonicalId: "radiator-soundtoys",
    image: "/images/products/soundtoys/radiator.webp",
    category: "Saturation",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["console", "tube", "saturation", "analog"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "SuperPlate",
    slug: "superplate",
    canonicalId: "superplate-soundtoys",
    image: "/images/products/soundtoys/superplate.webp",
    category: "Reverb",
    manufacturer: "Soundtoys",
    registeredPrice: 149,
    tags: ["reverb", "plate"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Little AlterBoy",
    slug: "little-alterboy",
    canonicalId: "little-alterboy-soundtoys",
    image: "/images/products/soundtoys/little-alterboy.webp",
    category: "Effects",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["vocal", "pitch-shift", "experimental"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "PanMan",
    slug: "panman",
    canonicalId: "panman-soundtoys",
    image: "/images/products/soundtoys/panman.webp",
    category: "Effects",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["auto-pan", "modulation", "experimental"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "Effect Rack",
    slug: "effect-rack",
    canonicalId: "effect-rack-soundtoys",
    image: "/images/products/soundtoys/effect-rack.webp",
    category: "Bundle",
    manufacturer: "Soundtoys",
    registeredPrice: 299,
    tags: ["bundle", "effects", "multi-effects"],
    retailers: ["plugin-boutique", "gear4music"],
  },
  {
    name: "SpaceBlender",
    slug: "spaceblender",
    canonicalId: "spaceblender-soundtoys",
    image: "/images/products/soundtoys/spaceblender.webp",
    category: "Reverb",
    manufacturer: "Soundtoys",
    registeredPrice: 99,
    tags: ["reverb", "experimental", "spatial"],
    retailers: ["plugin-boutique", "gear4music"],
  },
];

const PRODUCTS: SeedProduct[] = [
  ...BASE_PRODUCTS,
  ...WAVES_PRODUCTS,
  ...PLUGIN_ALLIANCE_PRODUCTS,
  ...UAD_PRODUCTS,
  ...MCDSP_PRODUCTS,
  ...FABFILTER_PRODUCTS,
  ...IZOTOPE_PRODUCTS,
  ...SONNOX_PRODUCTS,
  ...SOFTUBE_PRODUCTS,
  ...SSL_PRODUCTS,
  ...SLATE_PRODUCTS,
  ...EVENTIDE_PRODUCTS,
  ...NEWFANGLED_AUDIO_PRODUCTS,
  ...XLN_PRODUCTS,
  ...RELAB_PRODUCTS,
  ...ANTARES_PRODUCTS,
  ...BABY_AUDIO_PRODUCTS,
];

function generatePriceHistory(
  basePrice: number,
  retailerSlug: string,
  productId: mongoose.Types.ObjectId,
  days = 30,
  options?: { isHotDeal?: boolean },
) {
  const entries = [];
  const now = new Date();

  const retailerOffset = Math.sin(retailerSlug.charCodeAt(0) * 137) * 0.075;
  const baseRetailPrice =
    Math.round(basePrice * (1 + retailerOffset) * 100) / 100;

  const saleStart = options?.isHotDeal
    ? 22
    : Math.floor(Math.random() * 18) + 5;
  const saleEnd = options?.isHotDeal
    ? days - 1
    : saleStart + Math.floor(Math.random() * 4) + 4;
  const saleDiscount = options?.isHotDeal
    ? 0.55 + Math.random() * 0.15
    : 0.2 + Math.random() * 0.35;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayFromEnd = days - 1 - i;
    const isOnSale = dayFromEnd >= saleStart && dayFromEnd <= saleEnd;
    const isToday = i === 0;

    let price = baseRetailPrice;
    if (isOnSale) {
      price = Math.round(baseRetailPrice * (1 - saleDiscount) * 100) / 100;
    }

    if (!(options?.isHotDeal && isToday && isOnSale)) {
      const noise = 1 + (Math.random() - 0.5) * 0.04;
      price = Math.round(price * noise * 100) / 100;
    }
    price = Math.max(price, 0.99);

    entries.push({
      productId,
      retailerSlug,
      affiliateUrl: `https://example.com/ref/${retailerSlug}/${productId}`,
      price,
      currency: "USD",
      scrapedAt: date,
    });
  }

  return entries;
}

const HOT_DEAL_SLUGS = new Set([
  "platinum",
  "cla-76-compressor-limiter",
  "renaissance-vox",
  "bx_console-amek-9099",
  "soundtoys-5",
  "decapitator",
  "echoboy",
]);

function shouldSeedFakePrices(): boolean {
  const raw = process.env.SEED_FAKE_PRICES?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function parseSeedManufacturers(): string[] | null {
  const raw = process.env.SEED_MANUFACTURERS?.trim();
  if (!raw) return null;
  return raw.split(",").map((m) => m.trim()).filter(Boolean);
}

function filterProductsByManufacturers(
  products: SeedProduct[],
  manufacturers: string[],
): SeedProduct[] {
  const allowed = new Set(manufacturers.map((m) => m.toLowerCase()));
  return products.filter((p) => allowed.has(p.manufacturer.toLowerCase()));
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const seedManufacturers = parseSeedManufacturers();
  const isPartialSeed = seedManufacturers !== null && seedManufacturers.length > 0;
  const productsToSeed = isPartialSeed
    ? filterProductsByManufacturers(PRODUCTS, seedManufacturers)
    : PRODUCTS;

  if (isPartialSeed) {
    console.warn(
      `Partial seed mode — only upserting: ${seedManufacturers.join(", ")}`,
    );
    console.log(`Seeding ${productsToSeed.length} products (other manufacturers untouched)`);
  }

  warnCatalogSlugCollisions(PRODUCTS);

  const seedFakePrices = shouldSeedFakePrices();
  const existingProducts =
    seedFakePrices || isPartialSeed
      ? []
      : await Product.find({}).select("_id canonicalId").lean();
  const canonicalByOldId = new Map(
    existingProducts.map((p) => [p._id.toString(), p.canonicalId as string]),
  );

  if (!isPartialSeed) {
    await Product.deleteMany({});
    if (seedFakePrices) {
      await PriceEntry.deleteMany({});
      console.log("Cleared existing products and price entries");
    } else {
      console.log("Cleared existing products (will re-link PriceEntry by canonicalId)");
    }
  }

  const priceEntriesToInsert: object[] = [];
  const canonicalToNewId = new Map<string, mongoose.Types.ObjectId>();
  const usedSlugs = new Set<string>();
  const existingSlugByCanonicalId = new Map<string, string>();
  const catalogCanonicalIds = new Set(productsToSeed.map((p) => p.canonicalId));
  const seededManufacturerSet = new Set(
    productsToSeed.map((p) => p.manufacturer.toLowerCase()),
  );

  if (isPartialSeed) {
    const seededManufacturers = [
      ...new Set(productsToSeed.map((p) => p.manufacturer)),
    ];
    const orphanResult = await Product.deleteMany({
      manufacturer: { $in: seededManufacturers },
      canonicalId: { $nin: [...catalogCanonicalIds] },
    });
    if (orphanResult.deletedCount > 0) {
      console.log(
        `Removed ${orphanResult.deletedCount} stale product(s) from seeded manufacturers`,
      );
    }

    const existingProducts = await Product.find({})
      .select("slug canonicalId manufacturer")
      .lean();
    for (const product of existingProducts) {
      const isManagedManufacturer = seededManufacturerSet.has(
        product.manufacturer.toLowerCase(),
      );
      const isCatalogProduct =
        product.canonicalId &&
        catalogCanonicalIds.has(product.canonicalId);

      if (!isManagedManufacturer || isCatalogProduct) {
        usedSlugs.add(product.slug);
      }

      if (isCatalogProduct && product.canonicalId) {
        existingSlugByCanonicalId.set(product.canonicalId, product.slug);
      }
    }
  }

  let created = 0;
  let updated = 0;

  for (const p of productsToSeed) {
    const { retailers, ...productFields } = p;
    const canonicalId = productFields.canonicalId;

    const slugsForResolution = new Set(usedSlugs);
    const existingSlug = existingSlugByCanonicalId.get(canonicalId);
    if (existingSlug) slugsForResolution.delete(existingSlug);

    const slug = ensureUniqueSlug(
      productFields.slug,
      productFields.manufacturer,
      slugsForResolution,
    );
    usedSlugs.add(slug);

    const dealEndsAt = getEndsSoonDealEndDate(slug);
    const image = resolveProductImageSrc({
      image: productFields.image,
      slug: productFields.slug,
      canonicalId: productFields.canonicalId,
      manufacturer: productFields.manufacturer,
    });

    if (isPartialSeed) {
      const existed = await Product.exists({ canonicalId });
      const result = await Product.findOneAndUpdate(
        { canonicalId },
        {
          $set: {
            ...productFields,
            slug,
            canonicalId,
            image,
            ...(dealEndsAt && { dealEndsAt }),
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      if (result) {
        canonicalToNewId.set(canonicalId, result._id);
        if (existed) {
          updated++;
          console.log(`Updated product: ${result.name}`);
        } else {
          created++;
          console.log(`Created product: ${result.name}`);
        }
      }
    } else {
      const product = await Product.create({
        ...productFields,
        slug,
        canonicalId,
        image,
        ...(dealEndsAt && { dealEndsAt }),
      });
      canonicalToNewId.set(canonicalId, product._id);
      created++;
      console.log(`Created product: ${product.name}`);

      if (seedFakePrices) {
        for (const retailerSlug of retailers) {
          const entries = generatePriceHistory(
            productFields.registeredPrice,
            retailerSlug,
            product._id,
            30,
            { isHotDeal: HOT_DEAL_SLUGS.has(slug) },
          );
          priceEntriesToInsert.push(...entries);
        }
      }
    }
  }

  if (isPartialSeed) {
    console.log(`Partial seed done: ${created} created, ${updated} updated`);
  }

  if (seedFakePrices && priceEntriesToInsert.length > 0) {
    await PriceEntry.insertMany(priceEntriesToInsert);
    console.log(`Inserted ${priceEntriesToInsert.length} price entries`);
  } else if (!seedFakePrices && !isPartialSeed) {
    let relinked = 0;
    for (const [oldId, canonicalId] of canonicalByOldId) {
      const newId = canonicalToNewId.get(canonicalId);
      if (!newId) continue;
      const result = await PriceEntry.updateMany(
        { productId: new mongoose.Types.ObjectId(oldId) },
        { $set: { productId: newId } },
      );
      relinked += result.modifiedCount;
    }

    const validIds = [...canonicalToNewId.values()];
    const orphans = await PriceEntry.deleteMany({
      productId: { $nin: validIds },
    });

    console.log(
      `Re-linked ${relinked} price entries; removed ${orphans.deletedCount} orphans`,
    );
    if (relinked === 0) {
      console.log(
        "No prices linked — run audioplugin-worker catalog:bootstrap:all && catalog:scrape:all",
      );
    }
  }

  await mongoose.disconnect();
  console.log("Done! Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
