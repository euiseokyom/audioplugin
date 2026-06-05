const EXACT_CATEGORY_MAP: Record<string, string> = {
  "Premium Bundles": "Bundle",
  Bundles: "Bundle",
  "Bundle Upgrades": "Bundle",
  EQ: "Equalizer",
  Equalizers: "Equalizer",
  Compressors: "Compressor",
  Limiters: "Compressor",
  Reverb: "Reverb",
  Delays: "Delay",
  Delay: "Delay",
  Modulation: "Modulation",
  Phaser: "Modulation",
  Flanger: "Modulation",
  Chorus: "Modulation",
  Saturation: "Saturation",
  Distortion: "Saturation",
  Vocal: "Vocal",
  Restoration: "Restoration",
  "Channel Strips": "Channel Strip",
  Instruments: "Instrument",
  Synth: "Instrument",
  Synthesizer: "Instrument",
  Mastering: "Mastering",
  Pitch: "Modulation",
  "Pitch Correction": "Vocal",
  Analyzer: "Effects",
  Utilities: "Effects",
  Surround: "Effects",
  "SoundGrid": "Effects",
};

const KEYWORD_CATEGORY_RULES: { keywords: string[]; category: string }[] = [
  { keywords: ["bundle"], category: "Bundle" },
  { keywords: ["eq", "equal"], category: "Equalizer" },
  { keywords: ["compress", "limit"], category: "Compressor" },
  { keywords: ["reverb"], category: "Reverb" },
  { keywords: ["delay", "echo"], category: "Delay" },
  { keywords: ["modul", "phaser", "flanger", "chorus", "tremolo", "pan"], category: "Modulation" },
  { keywords: ["satur", "distort", "amp"], category: "Saturation" },
  { keywords: ["vocal", "pitch"], category: "Vocal" },
  { keywords: ["restor", "denois", "de-ess"], category: "Restoration" },
  { keywords: ["channel strip", "strip"], category: "Channel Strip" },
  { keywords: ["instrument", "synth"], category: "Instrument" },
  { keywords: ["master"], category: "Mastering" },
];

export function mapWavesCategory(
  gsfCategory: string,
  isBundle: boolean,
): string {
  if (isBundle) return "Bundle";

  const trimmed = gsfCategory.trim();
  if (trimmed && EXACT_CATEGORY_MAP[trimmed]) {
    return EXACT_CATEGORY_MAP[trimmed];
  }

  const lower = trimmed.toLowerCase();
  for (const rule of KEYWORD_CATEGORY_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.category;
    }
  }

  return "Effects";
}

export function categoryToTag(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}
