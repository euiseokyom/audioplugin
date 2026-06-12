/** Plugin Alliance vendor tags sold on Thomann — used when building the catalog. */
export const PLUGIN_ALLIANCE_THOMANN_VENDOR_TAGS = new Set([
  "acme-audio",
  "ada",
  "amek",
  "ampeg",
  "bettermaker",
  "black-box-analog-design",
  "chandler-limited",
  "cut-classic",
  "dangerous-music",
  "diezel",
  "engl",
  "friedman",
  "fuchs",
  "gallien-krueger",
  "harris-doyle",
  "hears",
  "hum-audio-devices",
  "karanyi-sounds",
  "knif-audio",
  "looptrotter",
  "m-ag-audio",
  "maor-appelbaum-mastering-hendyamps",
  "millennia",
  "mixland",
  "neold",
  "noveltech",
  "proaudiodsp",
  "purple-audio",
  "shadow-hills",
  "spl",
  "suhr",
  "swivel-audio",
  "three-body-technology",
  "thx",
  "tomo-audiolabs",
  "unfiltered-audio",
  "vertigo",
]);

/** Vendors with no third-party retailer coverage — excluded from the catalog. */
export const PLUGIN_ALLIANCE_SKIP_VENDOR_TAGS = new Set([
  "adptr-audio",
  "fuse-audio-labs",
]);

/** Individual products excluded from the Plugin Alliance catalog. */
export const PLUGIN_ALLIANCE_SKIP_PRODUCT_SLUGS = new Set([
  "dehumaniser-2",
  "reformer-pro",
]);

export function pluginAllianceRetailers(tags: string[]): string[] {
  const retailers = ["plugin-boutique", "gear4music"];
  const hasThomannVendor = tags.some((tag) =>
    PLUGIN_ALLIANCE_THOMANN_VENDOR_TAGS.has(tag),
  );
  if (hasThomannVendor) retailers.push("thomann");
  return retailers;
}

export function shouldSkipPluginAllianceVendor(vendorTag: string | undefined): boolean {
  return vendorTag !== undefined && PLUGIN_ALLIANCE_SKIP_VENDOR_TAGS.has(vendorTag);
}

export function shouldSkipPluginAllianceProduct(slug: string): boolean {
  return PLUGIN_ALLIANCE_SKIP_PRODUCT_SLUGS.has(slug);
}
