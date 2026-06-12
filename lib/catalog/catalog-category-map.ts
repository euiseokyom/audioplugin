import { isLimiterProduct } from "@/lib/catalog/limiter-category";

const TAG_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /bundle|collection|suite|pack/i, category: "Bundle" },
  { pattern: /addictive keys|piano|keyboard instrument/i, category: "Instrument" },
  { pattern: /eq|equal/i, category: "Equalizer" },
  { pattern: /ultramaximizer|multimaximizer|pro-l-?2|\blimiter\b/i, category: "Limiter" },
  { pattern: /compress|gate|de-ess|deess|supress/i, category: "Compressor" },
  { pattern: /channel strip|channel-strip/i, category: "Channel Strip" },
  { pattern: /reverb|verb/i, category: "Reverb" },
  { pattern: /delay|echo/i, category: "Delay" },
  { pattern: /synth/i, category: "Instrument" },
  { pattern: /satur|distort|saturn|trash/i, category: "Saturation" },
  { pattern: /meter|insight|analysis/i, category: "Metering" },
  { pattern: /repair|rx|restore|denois/i, category: "Restoration" },
  { pattern: /pitch|tune|vocal/i, category: "Pitch" },
];

export function mapCatalogCategory(
  name: string,
  slug: string,
  hints: { isBundle?: boolean; productType?: string; tags?: string[] } = {},
): string {
  if (hints.isBundle) return "Bundle";

  const type = hints.productType?.trim() ?? "";
  if (/bundle/i.test(type)) return "Bundle";

  if (isLimiterProduct(name, slug)) return "Limiter";

  const haystack = `${name} ${slug} ${type} ${(hints.tags ?? []).join(" ")}`.toLowerCase();
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }

  return "Effects";
}

export function categoryToTag(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export function isBundleNameOrSlug(name: string, slug: string): boolean {
  return /bundle|collection|suite|pack/i.test(`${name} ${slug}`);
}
