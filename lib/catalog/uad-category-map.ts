const TYPE_MAP: Record<string, string> = {
  "UAD Plug-Ins": "Effects",
  Bundles: "Bundle",
  "Pick Any Bundles": "Bundle",
  Subscription: "Bundle",
};

const TAG_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /bundle|pick\s*any/i, category: "Bundle" },
  { pattern: /compress|limit/i, category: "Compressor" },
  { pattern: /eq|equal/i, category: "Equalizer" },
  { pattern: /reverb/i, category: "Reverb" },
  { pattern: /delay|echo/i, category: "Delay" },
  { pattern: /guitar|amp|instrument/i, category: "Instrument" },
  { pattern: /channel strip|preamp|console/i, category: "Channel Strip" },
  { pattern: /satur|tape|distort/i, category: "Saturation" },
  { pattern: /modul|chorus|phaser/i, category: "Modulation" },
  { pattern: /vocal|pitch/i, category: "Vocal" },
];

export function mapUadCategory(
  productType: string,
  tags: string[],
  title: string,
  isBundle: boolean,
): string {
  if (isBundle) return "Bundle";

  const trimmed = productType.trim();
  if (trimmed && TYPE_MAP[trimmed] && TYPE_MAP[trimmed] !== "Effects") {
    return TYPE_MAP[trimmed];
  }

  const haystack = `${title} ${tags.join(" ")} ${trimmed}`.toLowerCase();
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(haystack)) return rule.category;
  }

  return "Effects";
}

export function categoryToTag(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}
