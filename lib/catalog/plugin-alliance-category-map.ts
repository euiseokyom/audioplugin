const TYPE_MAP: Record<string, string> = {
  Bundles: "Bundle",
  Bundle: "Bundle",
  EQ: "Equalizer",
  Equalizer: "Equalizer",
  Compressor: "Compressor",
  "Channel Strip": "Channel Strip",
  Reverb: "Reverb",
  Delay: "Delay",
  Modulation: "Modulation",
  Saturation: "Saturation",
  Limiter: "Compressor",
  Filter: "Equalizer",
  "Multi-Effect": "Effects",
};

const TAG_RULES: { pattern: RegExp; category: string }[] = [
  { pattern: /bundle/i, category: "Bundle" },
  { pattern: /eq|equal/i, category: "Equalizer" },
  { pattern: /compress|limit/i, category: "Compressor" },
  { pattern: /channel strip|console/i, category: "Channel Strip" },
  { pattern: /reverb/i, category: "Reverb" },
  { pattern: /delay/i, category: "Delay" },
  { pattern: /satur|distort/i, category: "Saturation" },
  { pattern: /modul|phaser/i, category: "Modulation" },
];

export function mapPluginAllianceCategory(
  productType: string,
  tags: string[],
  isBundle: boolean,
): string {
  if (isBundle) return "Bundle";

  const trimmed = productType.trim();
  if (trimmed && TYPE_MAP[trimmed]) return TYPE_MAP[trimmed];

  const tagText = tags.join(" ");
  for (const rule of TAG_RULES) {
    if (rule.pattern.test(trimmed) || rule.pattern.test(tagText)) {
      return rule.category;
    }
  }

  return "Effects";
}

export function categoryToTag(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}
