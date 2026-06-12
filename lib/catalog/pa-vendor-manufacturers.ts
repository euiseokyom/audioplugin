/** PA vendor tags that map to their own manufacturer page (not "Plugin Alliance"). */
export const PA_VENDOR_TO_MANUFACTURER: Record<string, string> = {
  "baby-audio": "Baby Audio",
  "mastering-the-mix": "Mastering the Mix",
};

/** Vendors with a dedicated catalog file — exclude from plugin-alliance-products.ts. */
export const PA_VENDORS_WITH_OWN_CATALOG = new Set(["baby-audio"]);

export function resolvePaProductManufacturer(tags: string[]): string {
  for (const tag of tags) {
    const manufacturer = PA_VENDOR_TO_MANUFACTURER[tag];
    if (manufacturer) return manufacturer;
  }
  return "Plugin Alliance";
}

export function shouldExcludeFromPluginAllianceCatalog(tags: string[]): boolean {
  return tags.some((tag) => PA_VENDORS_WITH_OWN_CATALOG.has(tag));
}
