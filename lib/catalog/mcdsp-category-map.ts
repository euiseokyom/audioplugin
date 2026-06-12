import { isLimiterProduct } from "@/lib/catalog/limiter-category";

const PATH_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /pack|bundle/i, category: "Bundle" },
  { pattern: /channel-g|channel-strip|6050/i, category: "Channel Strip" },
  { pattern: /4040-retro|ml4000|ml8000|\blimiter\b/i, category: "Limiter" },
  { pattern: /compress|mc2000/i, category: "Compressor" },
  { pattern: /eq|filterbank|de555|nf575/i, category: "Equalizer" },
  { pattern: /reverb|delay|echo|ec300|futzverb/i, category: "Delay" },
  { pattern: /noise|nr800|ae600/i, category: "Restoration" },
  { pattern: /futz|specialty/i, category: "Effects" },
];

export function mapMcdspCategory(pathSegment: string, title: string): string {
  const slug = pathSegment.split("/").filter(Boolean).pop() ?? pathSegment;
  if (isLimiterProduct(title, slug)) return "Limiter";

  const haystack = `${pathSegment} ${title}`.toLowerCase();
  for (const rule of PATH_RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }
  return "Effects";
}

export function categoryToTag(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}
