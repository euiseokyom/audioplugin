import excludedCatalogSlugs from "@/lib/catalog/excluded-catalog-slugs.json";
import type { SeedProduct } from "@/lib/catalog/seed-product";

export interface ExcludedCatalogSlug {
  slug: string;
  reason: string;
  date: string;
  name?: string;
  manufacturer?: string;
}

export const EXCLUDED_CATALOG_SLUGS = excludedCatalogSlugs as ExcludedCatalogSlug[];

export const EXCLUDED_CATALOG_SLUG_SET = new Set(
  EXCLUDED_CATALOG_SLUGS.map((entry) => entry.slug),
);

export function isExcludedCatalogSlug(slug: string): boolean {
  return EXCLUDED_CATALOG_SLUG_SET.has(slug);
}

export function filterExcludedSeedProducts<T extends Pick<SeedProduct, "slug">>(
  products: T[],
): T[] {
  return products.filter((product) => !isExcludedCatalogSlug(product.slug));
}

export function filterExcludedCatalogItems<
  T extends { slug: string; name?: string },
>(items: T[]): T[] {
  const kept: T[] = [];
  for (const item of items) {
    const slug = item.slug.trim();
    if (isExcludedCatalogSlug(slug)) {
      console.warn(`  ⊘ Excluded from catalog: ${item.name ?? slug} (${slug})`);
      continue;
    }
    kept.push(item);
  }
  return kept;
}
