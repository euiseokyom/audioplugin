/** Manufacturer folder tags — longest first for canonicalId suffix matching. */
export const MANUFACTURER_IMAGE_TAGS = [
  "relab-development",
  "solid-state-logic",
  "plugin-alliance",
  "universal-audio",
  "slate-digital",
  "baby-audio",
  "xln-audio",
  "soundtoys",
  "fabfilter",
  "softube",
  "eventide",
  "antares",
  "izotope",
  "sonnox",
  "mcdsp",
  "output",
  "waves",
] as const;

const MANUFACTURER_TO_TAG: Record<string, string> = {
  Waves: "waves",
  "Plugin Alliance": "plugin-alliance",
  "Universal Audio": "universal-audio",
  McDSP: "mcdsp",
  FabFilter: "fabfilter",
  iZotope: "izotope",
  Sonnox: "sonnox",
  Softube: "softube",
  "Solid State Logic": "solid-state-logic",
  "Slate Digital": "slate-digital",
  Eventide: "eventide",
  "XLN Audio": "xln-audio",
  "Relab Development": "relab-development",
  Antares: "antares",
  Output: "output",
  "Baby Audio": "baby-audio",
  Soundtoys: "soundtoys",
};

/** Public URL for a processed product tile WebP. */
export function productImageUrl(manufacturerTag: string, slug: string): string {
  return `/images/products/${manufacturerTag}/${slug}.webp`;
}

export function manufacturerTagFromCanonicalId(
  canonicalId: string,
): string | null {
  for (const tag of MANUFACTURER_IMAGE_TAGS) {
    if (canonicalId.endsWith(`-${tag}`)) return tag;
  }
  return null;
}

export function manufacturerTagFromName(manufacturer: string): string | null {
  return MANUFACTURER_TO_TAG[manufacturer] ?? null;
}

export type ProductImageLookup = {
  image: string;
  slug?: string;
  canonicalId?: string;
  manufacturer?: string;
};

/** Image files use catalog slugs; DB slugs may add a manufacturer suffix on collision. */
export function productImageFileSlug(
  slug: string,
  canonicalId?: string,
): string {
  const tag = canonicalId && manufacturerTagFromCanonicalId(canonicalId);
  if (tag && slug.endsWith(`-${tag}`)) {
    return slug.slice(0, -(tag.length + 1));
  }
  return slug;
}

/**
 * Resolve product image paths after the manufacturer subfolder migration.
 * Maps legacy flat paths (/images/products/foo.webp) to nested paths.
 */
export function resolveProductImageSrc(product: ProductImageLookup): string {
  const { image, slug, canonicalId, manufacturer } = product;

  const tag =
    (canonicalId && manufacturerTagFromCanonicalId(canonicalId)) ??
    (manufacturer && manufacturerTagFromName(manufacturer)) ??
    null;

  const nestedMatch = image.match(
    /^\/images\/products\/([^/]+)\/([^/]+)\.webp$/,
  );
  if (nestedMatch) {
    const imageTag = tag ?? nestedMatch[1];
    const fileSlug = slug
      ? productImageFileSlug(slug, canonicalId)
      : nestedMatch[2];
    if (tag) return productImageUrl(imageTag, fileSlug);
    return image;
  }

  const flatMatch = image.match(/^\/images\/products\/([^/]+)\.webp$/);
  if (!flatMatch) return image;

  const fileSlug = slug
    ? productImageFileSlug(slug, canonicalId)
    : flatMatch[1];
  if (!tag) return image;

  return productImageUrl(tag, fileSlug);
}
