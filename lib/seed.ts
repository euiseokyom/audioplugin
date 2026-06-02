/**
 * Run with: npx ts-node --project tsconfig.json lib/seed.ts
 * Or via: npm run seed (add "seed": "ts-node lib/seed.ts" to package.json scripts)
 */

import mongoose from "mongoose";
import Product from "@/models/Product";
import PriceEntry from "@/models/PriceEntry";
import { getEndsSoonDealEndDate } from "@/lib/ends-soon";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/audioplugin";

const PRODUCTS = [
  {
    name: "Serum",
    slug: "serum-xfer-records",
    canonicalId: "serum-xfer-records",
    image: "https://picsum.photos/seed/serum/400/300",
    description:
      "Serum is a wavetable synthesizer plugin known for its high-quality sound and intuitive workflow. Used by producers worldwide to craft everything from bass to leads.",
    category: "Synthesizer",
    manufacturer: "Xfer Records",
    registeredPrice: 189,
    salesCount: 9200,
    tags: ["wavetable", "synth", "bass", "leads"],
  },
  {
    name: "Omnisphere 2",
    slug: "omnisphere-2-spectrasonics",
    canonicalId: "omnisphere-2-spectrasonics",
    image: "https://picsum.photos/seed/omnisphere/400/300",
    description:
      "Omnisphere 2 is a flagship synthesizer from Spectrasonics featuring over 14,000 sounds, hardware synth integration, and a massive sound library.",
    category: "Synthesizer",
    manufacturer: "Spectrasonics",
    registeredPrice: 499,
    salesCount: 7500,
    tags: ["synth", "orchestral", "cinematic", "professional"],
  },
  {
    name: "Ozone 11 Advanced",
    slug: "ozone-11-advanced-izotope",
    canonicalId: "ozone-11-advanced-izotope",
    image: "https://picsum.photos/seed/ozone11/400/300",
    description:
      "Ozone 11 is iZotope's flagship mastering suite. AI-assisted mastering tools, a full signal chain, and reference track matching.",
    category: "Mastering",
    manufacturer: "iZotope",
    registeredPrice: 499,
    salesCount: 6800,
    tags: ["mastering", "AI", "limiter", "EQ"],
  },
  {
    name: "FabFilter Pro-Q 3",
    slug: "pro-q-3-fabfilter",
    canonicalId: "pro-q-3-fabfilter",
    image: "https://picsum.photos/seed/proq3/400/300",
    description:
      "Pro-Q 3 is the industry-standard EQ plugin with 24 EQ bands, dynamic EQ, mid/side processing, and zero-latency linear phase mode.",
    category: "EQ",
    manufacturer: "FabFilter",
    registeredPrice: 179,
    salesCount: 8100,
    tags: ["EQ", "dynamic EQ", "linear phase", "mixing"],
  },
  {
    name: "Valhalla Room",
    slug: "valhalla-room-valhalla",
    canonicalId: "valhalla-room-valhalla",
    image: "https://picsum.photos/seed/valhallaroom/400/300",
    description:
      "Valhalla Room is a versatile algorithmic reverb plugin beloved for its lush, natural room sounds at an unbeatable price.",
    category: "Reverb",
    manufacturer: "Valhalla DSP",
    registeredPrice: 50,
    salesCount: 11000,
    tags: ["reverb", "algorithmic", "room", "lush"],
  },
  {
    name: "Pigments 5",
    slug: "pigments-5-arturia",
    canonicalId: "pigments-5-arturia",
    image: "https://picsum.photos/seed/pigments5/400/300",
    description:
      "Pigments 5 by Arturia is a polychrome software synthesizer combining wavetable, virtual analog, harmonic, and sample engines.",
    category: "Synthesizer",
    manufacturer: "Arturia",
    registeredPrice: 199,
    salesCount: 5400,
    tags: ["wavetable", "analog", "synth", "pads"],
  },
  {
    name: "Kontakt 7",
    slug: "kontakt-7-native-instruments",
    canonicalId: "kontakt-7-native-instruments",
    image: "https://picsum.photos/seed/kontakt7/400/300",
    description:
      "Kontakt 7 is Native Instruments' industry-standard sampler with deep scripting, a massive library ecosystem, and real-time performance tools.",
    category: "Sampler",
    manufacturer: "Native Instruments",
    registeredPrice: 399,
    salesCount: 7200,
    tags: ["sampler", "orchestral", "sound design", "instruments"],
  },
  {
    name: "Waves SSL G-Master Buss Compressor",
    slug: "ssl-g-master-buss-compressor-waves",
    canonicalId: "ssl-g-master-buss-compressor-waves",
    image: "https://picsum.photos/seed/sslgcomp/400/300",
    description:
      "An emulation of the classic SSL G-Series console buss compressor — one of the most sought-after compressors in professional mixing.",
    category: "Compressor",
    manufacturer: "Waves",
    registeredPrice: 249,
    salesCount: 6500,
    tags: ["compressor", "SSL", "bus", "glue"],
  },
  {
    name: "FabFilter Pro-MB",
    slug: "pro-mb-fabfilter",
    canonicalId: "pro-mb-fabfilter",
    image: "https://picsum.photos/seed/promb/400/300",
    description:
      "Pro-MB is a multiband dynamics processor that works like a combination of a compressor and expander with per-band control.",
    category: "Compressor",
    manufacturer: "FabFilter",
    registeredPrice: 179,
    salesCount: 4200,
    tags: ["multiband", "compressor", "dynamics", "mixing"],
  },
  {
    name: "iZotope RX 11 Advanced",
    slug: "rx-11-advanced-izotope",
    canonicalId: "rx-11-advanced-izotope",
    image: "https://picsum.photos/seed/rx11/400/300",
    description:
      "RX 11 Advanced is the professional audio repair and restoration suite used in post-production, music, and broadcast industries.",
    category: "Audio Repair",
    manufacturer: "iZotope",
    registeredPrice: 1199,
    salesCount: 3100,
    tags: ["repair", "restoration", "noise reduction", "post"],
  },
  {
    name: "Massive X",
    slug: "massive-x-native-instruments",
    canonicalId: "massive-x-native-instruments",
    image: "https://picsum.photos/seed/massivex/400/300",
    description:
      "Massive X is the next generation of Native Instruments' iconic synthesizer, featuring two oscillators with 170+ wavetables and flexible routing.",
    category: "Synthesizer",
    manufacturer: "Native Instruments",
    registeredPrice: 199,
    salesCount: 4800,
    tags: ["wavetable", "synth", "bass", "EDM"],
  },
  {
    name: "Arturia V Collection X",
    slug: "v-collection-x-arturia",
    canonicalId: "v-collection-x-arturia",
    image: "https://picsum.photos/seed/vcollection/400/300",
    description:
      "V Collection X is Arturia's definitive bundle of 40+ vintage keyboard and synth emulations including the Minimoog, Prophet-5, and CS-80.",
    category: "Bundle",
    manufacturer: "Arturia",
    registeredPrice: 599,
    salesCount: 5900,
    tags: ["vintage", "bundle", "piano", "synth"],
  },
  {
    name: "Soundtoys 5 Bundle",
    slug: "soundtoys-5-bundle",
    canonicalId: "soundtoys-5-bundle",
    image: "https://picsum.photos/seed/soundtoys5/400/300",
    description:
      "Soundtoys 5 is the complete bundle of legendary creative effects including EchoBoy, Decapitator, PrimalTap, and 14 more.",
    category: "Bundle",
    manufacturer: "Soundtoys",
    registeredPrice: 499,
    salesCount: 5200,
    tags: ["effects", "saturation", "delay", "bundle"],
  },
  {
    name: "Decapitator",
    slug: "decapitator-soundtoys",
    canonicalId: "decapitator-soundtoys",
    image: "https://picsum.photos/seed/decapitator/400/300",
    description:
      "Decapitator is Soundtoys' analog saturation plugin, modeled after 5 classic hardware saturation units with a punish switch.",
    category: "Saturation",
    manufacturer: "Soundtoys",
    registeredPrice: 199,
    salesCount: 6100,
    tags: ["saturation", "distortion", "analog", "warmth"],
  },
  {
    name: "Reaktor 6",
    slug: "reaktor-6-native-instruments",
    canonicalId: "reaktor-6-native-instruments",
    image: "https://picsum.photos/seed/reaktor6/400/300",
    description:
      "Reaktor 6 is a modular sound design environment from Native Instruments. Build your own instruments and effects or use the huge library of user-built Ensembles.",
    category: "Modular",
    manufacturer: "Native Instruments",
    registeredPrice: 199,
    salesCount: 3800,
    tags: ["modular", "synthesis", "sound design", "instruments"],
  },
  {
    name: "Slate Digital All Access Pass",
    slug: "all-access-pass-slate-digital",
    canonicalId: "all-access-pass-slate-digital",
    image: "https://picsum.photos/seed/slateallaccess/400/300",
    description:
      "The Slate Digital All Access Pass gives you unlimited access to the full Slate Digital plugin catalog including VCC, VMR, FG-X, and more.",
    category: "Bundle",
    manufacturer: "Slate Digital",
    registeredPrice: 499,
    salesCount: 4300,
    tags: ["bundle", "subscription", "mixing", "mastering"],
  },
  {
    name: "FabFilter Pro-L 2",
    slug: "pro-l-2-fabfilter",
    canonicalId: "pro-l-2-fabfilter",
    image: "https://picsum.photos/seed/prol2/400/300",
    description:
      "Pro-L 2 is FabFilter's True Peak limiter plugin for mastering. Eight limiting algorithms, loudness metering, and transparent sound.",
    category: "Limiter",
    manufacturer: "FabFilter",
    registeredPrice: 179,
    salesCount: 7300,
    tags: ["limiter", "mastering", "true peak", "loudness"],
  },
  {
    name: "Spire Studio",
    slug: "spire-studio-reveal-sound",
    canonicalId: "spire-studio-reveal-sound",
    image: "https://picsum.photos/seed/spirestudio/400/300",
    description:
      "Spire is a polyphonic synthesizer combining flexibility and a character of its own with four synthesis types and a built-in effects section.",
    category: "Synthesizer",
    manufacturer: "Reveal Sound",
    registeredPrice: 179,
    salesCount: 3500,
    tags: ["synth", "EDM", "leads", "bass"],
  },
  {
    name: "Slate + Ash Cycles",
    slug: "cycles-slate-ash",
    canonicalId: "cycles-slate-ash",
    image: "https://picsum.photos/seed/cycles/400/300",
    description:
      "Cycles is an innovative cinematic instrument library for Kontakt featuring evolving textures, rhythmic elements, and hybrid sounds.",
    category: "Sample Library",
    manufacturer: "Slate + Ash",
    registeredPrice: 149,
    salesCount: 2900,
    tags: ["cinematic", "kontakt", "texture", "ambient"],
  },
  {
    name: "Krotos Weaponiser",
    slug: "weaponiser-krotos",
    canonicalId: "weaponiser-krotos",
    image: "https://picsum.photos/seed/weaponiser/400/300",
    description:
      "Weaponiser is a real-time weapon sound design plugin by Krotos. Layer and manipulate sounds to create unique weapon audio for film and games.",
    category: "Sound Design",
    manufacturer: "Krotos",
    registeredPrice: 299,
    salesCount: 2100,
    tags: ["sound design", "weapons", "game audio", "film"],
  },
];

const RETAILER_ASSIGNMENTS: Record<string, string[]> = {
  "serum-xfer-records": ["plugin-boutique", "sweetwater", "adsr", "audio-plugin-deals", "pluginfox"],
  "omnisphere-2-spectrasonics": ["sweetwater", "plugin-boutique", "gear4music", "zzounds", "guitar-center"],
  "ozone-11-advanced-izotope": ["plugin-boutique", "sweetwater", "audio-plugin-deals", "pluginfox", "adsr"],
  "pro-q-3-fabfilter": ["plugin-boutique", "sweetwater", "thomann", "gear4music", "adsr", "pluginfox"],
  "valhalla-room-valhalla": ["plugin-boutique", "sweetwater", "adsr", "audio-plugin-deals", "pluginfox"],
  "pigments-5-arturia": ["arturia", "plugin-boutique", "sweetwater", "thomann", "gear4music"],
  "kontakt-7-native-instruments": ["native-instruments", "sweetwater", "thomann", "gear4music", "zzounds", "guitar-center"],
  "ssl-g-master-buss-compressor-waves": ["waves", "plugin-boutique", "sweetwater", "adsr", "audio-plugin-deals"],
  "pro-mb-fabfilter": ["plugin-boutique", "sweetwater", "thomann", "adsr"],
  "rx-11-advanced-izotope": ["plugin-boutique", "sweetwater", "audio-plugin-deals", "adsr"],
  "massive-x-native-instruments": ["native-instruments", "sweetwater", "thomann", "gear4music"],
  "v-collection-x-arturia": ["arturia", "plugin-boutique", "sweetwater", "thomann", "gear4music"],
  "soundtoys-5-bundle": ["plugin-boutique", "sweetwater", "adsr", "audio-plugin-deals", "best-service"],
  "decapitator-soundtoys": ["plugin-boutique", "sweetwater", "adsr", "audio-plugin-deals"],
  "reaktor-6-native-instruments": ["native-instruments", "sweetwater", "thomann", "plugin-boutique"],
  "all-access-pass-slate-digital": ["plugin-boutique", "audio-plugin-deals", "adsr"],
  "pro-l-2-fabfilter": ["plugin-boutique", "sweetwater", "thomann", "adsr", "pluginfox"],
  "spire-studio-reveal-sound": ["plugin-boutique", "adsr", "audio-plugin-deals", "pluginfox"],
  "cycles-slate-ash": ["plugin-boutique", "best-service", "adsr"],
  "weaponiser-krotos": ["krotos", "plugin-boutique", "adsr", "best-service"],
};

// Replace "arturia" reference in assignments with correct slug
const CANONICAL_RETAILERS: Record<string, string> = {
  arturia: "plugin-boutique", // manufacturer-direct not in our list — map to closest
};

function generatePriceHistory(
  basePrice: number,
  retailerSlug: string,
  productId: mongoose.Types.ObjectId,
  days = 30,
  options?: { isHotDeal?: boolean }
) {
  const entries = [];
  const now = new Date();

  const retailerOffset = Math.sin(retailerSlug.charCodeAt(0) * 137) * 0.075;
  const baseRetailPrice = Math.round(basePrice * (1 + retailerOffset) * 100) / 100;

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
  "serum-xfer-records",
  "omnisphere-2-spectrasonics",
  "ozone-11-advanced-izotope",
  "valhalla-room-valhalla",
  "soundtoys-5-bundle",
  "decapitator-soundtoys",
  "v-collection-x-arturia",
  "all-access-pass-slate-digital",
]);


async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await Product.deleteMany({});
  await PriceEntry.deleteMany({});
  console.log("Cleared existing data");

  const priceEntriesToInsert: object[] = [];

  for (const p of PRODUCTS) {
    const dealEndsAt = getEndsSoonDealEndDate(p.slug);
    const product = await Product.create({ ...p, ...(dealEndsAt && { dealEndsAt }) });
    console.log(`Created product: ${product.name}`);

    const retailers = (RETAILER_ASSIGNMENTS[p.canonicalId] ?? []).map(
      (slug) => CANONICAL_RETAILERS[slug] ?? slug
    );

    for (const retailerSlug of retailers) {
      const entries = generatePriceHistory(
        p.registeredPrice,
        retailerSlug,
        product._id,
        30,
        { isHotDeal: HOT_DEAL_SLUGS.has(p.slug) }
      );
      priceEntriesToInsert.push(...entries);
    }
  }

  await PriceEntry.insertMany(priceEntriesToInsert);
  console.log(`Inserted ${priceEntriesToInsert.length} price entries`);

  await mongoose.disconnect();
  console.log("Done! Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
