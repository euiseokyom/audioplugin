import type { MetadataRoute } from "next";
import { getCategories } from "@/services/categories";
import { getManufacturers } from "@/services/manufacturers";
import { getProductSlugsForSitemap } from "@/services/products";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

function slugifyName(name: string): string {
  return encodeURIComponent(name.toLowerCase());
}

// When catalog exceeds ~5k–10k products, split into a sitemap index.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const [products, categories, manufacturers] = await Promise.all([
    getProductSlugsForSitemap(),
    getCategories(),
    getManufacturers(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${base}/search`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/products/${product.slug}`,
    lastModified: product.updatedAt ?? new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${base}/category/${slugifyName(cat.name)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const manufacturerPages: MetadataRoute.Sitemap = manufacturers.map((mfr) => ({
    url: `${base}/manufacturer/${slugifyName(mfr.name)}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages, ...manufacturerPages];
}
