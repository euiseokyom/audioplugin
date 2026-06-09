import type { SeedProduct } from "@/lib/catalog/seed-product";

export type SlugCollision = {
  slug: string;
  entries: { name: string; manufacturer: string; canonicalId: string }[];
};

export function manufacturerSlugSuffix(manufacturer: string): string {
  return manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function ensureUniqueSlug(
  slug: string,
  manufacturer: string,
  usedSlugs: Set<string>,
): string {
  if (!usedSlugs.has(slug)) return slug;

  const suffix = manufacturerSlugSuffix(manufacturer);
  let candidate = `${slug}-${suffix}`;
  let counter = 2;
  while (usedSlugs.has(candidate)) {
    candidate = `${slug}-${suffix}-${counter}`;
    counter++;
  }

  console.warn(
    `Duplicate slug "${slug}" — using "${candidate}" for ${manufacturer}`,
  );
  return candidate;
}

export function findCatalogSlugCollisions(
  products: SeedProduct[],
): SlugCollision[] {
  const bySlug = new Map<string, SlugCollision["entries"]>();

  for (const p of products) {
    const entries = bySlug.get(p.slug) ?? [];
    entries.push({
      name: p.name,
      manufacturer: p.manufacturer,
      canonicalId: p.canonicalId,
    });
    bySlug.set(p.slug, entries);
  }

  return [...bySlug.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([slug, entries]) => ({ slug, entries }));
}

export function warnCatalogSlugCollisions(products: SeedProduct[]): void {
  const collisions = findCatalogSlugCollisions(products);
  if (collisions.length === 0) return;

  console.warn(
    `Catalog has ${collisions.length} duplicate slug(s) across products (auto-resolved at seed time):`,
  );
  for (const { slug, entries } of collisions) {
    console.warn(
      `  "${slug}": ${entries.map((e) => `${e.name} (${e.manufacturer})`).join(", ")}`,
    );
  }
}
