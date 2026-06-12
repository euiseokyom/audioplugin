/** URL slug for a manufacturer page, e.g. "Universal Audio" → "universal-audio". */
export function manufacturerToSlug(name: string): string {
  return encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
}

/** Decode a manufacturer route param to a comparable name key. */
export function normalizeManufacturerSlug(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ").trim();
}

export function matchManufacturer(
  dbName: string,
  slugOrName: string,
): boolean {
  const normalized = (value: string) =>
    value.toLowerCase().replace(/\s+/g, " ").trim();
  return normalized(dbName) === normalized(normalizeManufacturerSlug(slugOrName));
}
