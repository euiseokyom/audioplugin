/**
 * Shared helpers for official-manufacturer catalog build scripts.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  categoryToTag,
  isBundleNameOrSlug,
  mapCatalogCategory,
} from "../../lib/catalog/catalog-category-map";
import { productImageUrl } from "../../lib/catalog/product-image-path";
import type { SeedProduct } from "../../lib/catalog/seed-product";
import {
  decodeHtmlEntities,
  fetchPageHtml,
  isSoftubeCategoryHubTitle,
  normalizeFabFilterProductName,
  normalizeSoftubeProductName,
  shouldSkipSoftubeCatalogItem,
  normalizeProductSlug,
  parseMetaProductPrice,
  parseTitleFromHtml,
  registeredPriceUsd,
  resolveProductImage,
  resolveSslProductImageFromHtmlPages,
} from "./page-scrape";
import {
  processProductImageFromUrls,
  type ImageProcessingProfile,
} from "./process-product-image";
import { serializeCatalogProducts } from "./shopify-catalog";

const ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../..");

export type CatalogSourceItem = {
  name: string;
  slug: string;
  pageUrl: string;
  categoryHint?: string;
  isBundle?: boolean;
  tags?: string[];
  registeredPrice?: number;
  imageUrl?: string | null;
};

export type BuildCatalogOptions = {
  manufacturer: string;
  manufacturerTag: string;
  exportName: string;
  generatedBy: string;
  outputFile: string;
  items: CatalogSourceItem[];
  delayMs?: number;
  processingProfile?: ImageProcessingProfile;
};

export async function enrichFromProductPage(
  item: CatalogSourceItem,
): Promise<CatalogSourceItem> {
  const html = await fetchPageHtml(item.pageUrl);
  if (!html) return item;

  const title = parseTitleFromHtml(html);
  const priceMeta = parseMetaProductPrice(html);
  const imageUrl =
    item.imageUrl ?? resolveProductImage(html, item.pageUrl, { slug: item.slug });
  let name = title ?? item.name;
  if (/fabfilter\.com/i.test(item.pageUrl)) {
    name = normalizeFabFilterProductName(name);
  }
  if (/softube\.com/i.test(item.pageUrl)) {
    name = normalizeSoftubeProductName(name);
  }

  return {
    ...item,
    name,
    registeredPrice:
      item.registeredPrice ??
      (priceMeta
        ? registeredPriceUsd(priceMeta.amount, priceMeta.currency)
        : undefined),
    imageUrl,
  };
}

export async function buildCatalogFile(
  options: BuildCatalogOptions,
): Promise<{ products: SeedProduct[]; imageSuccess: number }> {
  const {
    manufacturer,
    manufacturerTag,
    exportName,
    generatedBy,
    outputFile,
    items,
    delayMs = 150,
    processingProfile,
  } = options;

  const bySlug = new Map<string, SeedProduct>();
  let imageSuccess = 0;

  for (let i = 0; i < items.length; i++) {
    const raw = items[i];
    const slug = normalizeProductSlug(raw.slug);
    if (!slug) continue;

    const isBundle =
      raw.isBundle ?? isBundleNameOrSlug(raw.name, slug);
    const category = mapCatalogCategory(raw.name, slug, {
      isBundle,
      tags: raw.tags,
      productType: raw.categoryHint,
    });

    const tags = new Set<string>([
      manufacturerTag,
      categoryToTag(category),
      ...(raw.tags ?? []),
    ]);
    if (isBundle) tags.add("bundle");

    if (raw.imageUrl) {
      const ok = await processProductImageFromUrls(slug, [raw.imageUrl], {
        manufacturerTag,
        processingProfile,
      });
      if (ok) imageSuccess++;
    } else {
      console.warn(`  ✗ No image for ${slug}`);
    }

    bySlug.set(slug, {
      name: raw.name,
      slug,
      canonicalId: `${slug}-${manufacturerTag}`,
      image: productImageUrl(manufacturerTag, slug),
      category,
      manufacturer,
      registeredPrice: raw.registeredPrice ?? 0,
      tags: [...tags],
      retailers: ["plugin-boutique"],
    });

    if ((i + 1) % 20 === 0) {
      console.log(`  ${i + 1}/${items.length} processed...`);
    }

    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  const products = [...bySlug.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const output = serializeCatalogProducts(products, {
    exportName,
    generatedBy,
  });

  await fs.writeFile(path.join(ROOT, outputFile), output, "utf8");
  console.log(`Wrote ${products.length} products to ${outputFile}`);
  console.log(`Images: ${imageSuccess}/${products.length} succeeded`);

  return { products, imageSuccess };
}

export async function fetchFabFilterShopPrice(
  productPath: string,
): Promise<number> {
  const shopPath = productPath.replace(/^\/products\//, "/shop/");
  const url = `https://www.fabfilter.com${shopPath}?currency=USD&vat=0`;
  const html = await fetchPageHtml(url);
  if (!html) return 0;

  const priceMeta = parseMetaProductPrice(html);
  if (!priceMeta) return 0;

  return registeredPriceUsd(priceMeta.amount, priceMeta.currency);
}

export async function discoverSoftubeProducts(): Promise<CatalogSourceItem[]> {
  const categories = ["mixing", "mastering", "synthesizers", "guitar-bass"];
  const paths = new Set<string>();

  for (const category of categories) {
    const html = await fetchPageHtml(
      `https://www.softube.com/plug-ins/${category}`,
    );
    if (!html) continue;

    const matches = [
      ...html.matchAll(
        new RegExp(
          `href="(/plug-ins/${category}/[a-z0-9-]+)"`,
          "gi",
        ),
      ),
    ];

    for (const match of matches) {
      paths.add(match[1].replace(/\/$/, ""));
    }
  }

  const items: CatalogSourceItem[] = [];

  for (const pathname of [...paths].sort()) {
    const pageUrl = `https://www.softube.com${pathname}`;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "";
    const enriched = await enrichFromProductPage({
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl,
    });

    if (shouldSkipSoftubeCatalogItem(enriched)) continue;

    items.push({
      ...enriched,
      isBundle: isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 120));
  }

  return items;
}

export async function discoverSonnoxFromSitemap(): Promise<CatalogSourceItem[]> {
  const xml = await fetchPageHtml(
    "https://sonnox.com/xmlsitemap.php?type=products&page=1",
  );
  if (!xml) return [];

  const locs = [
    ...xml.matchAll(/<loc>(https:\/\/sonnox\.com\/products\/[^<]+)<\/loc>/gi),
  ].map((m) => m[1]);

  const items: CatalogSourceItem[] = [];

  for (const pageUrl of locs) {
    const slug = pageUrl.split("/").filter(Boolean).pop() ?? "";
    const enriched = await enrichFromProductPage({
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl,
    });

    items.push({
      ...enriched,
      isBundle: isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 120));
  }

  return items;
}

export async function discoverSslStoreProducts(): Promise<CatalogSourceItem[]> {
  const html = await fetchPageHtml("https://store.solidstatelogic.com/plug-ins");
  if (!html) return [];

  const urls = [
    ...html.matchAll(
      /href="(https:\/\/store\.solidstatelogic\.com\/plug-ins\/[^"]+)"/gi,
    ),
  ].map((m) => m[1]);

  const items: CatalogSourceItem[] = [];

  for (const storeUrl of [...new Set(urls)].sort()) {
    const slug = normalizeProductSlug(storeUrl.split("/").pop() ?? "");
    const marketingUrl = `https://solidstatelogic.com/products/${slug}`;
    const [marketingHtml, storeHtml] = await Promise.all([
      fetchPageHtml(marketingUrl),
      fetchPageHtml(storeUrl),
    ]);

    let enriched: CatalogSourceItem = {
      name: slug.replace(/-/g, " "),
      slug,
      pageUrl: marketingUrl,
    };

    if (marketingHtml) {
      const title = parseTitleFromHtml(marketingHtml);
      const priceMeta = parseMetaProductPrice(marketingHtml);
      enriched = {
        ...enriched,
        name: title ?? enriched.name,
        registeredPrice: priceMeta
          ? registeredPriceUsd(priceMeta.amount, priceMeta.currency)
          : undefined,
      };
    }

    const htmlPages = [
      ...(marketingHtml ? [{ html: marketingHtml, pageUrl: marketingUrl }] : []),
      ...(storeHtml ? [{ html: storeHtml, pageUrl: storeUrl }] : []),
    ];
    const imageUrl = resolveSslProductImageFromHtmlPages(htmlPages, slug);
    if (imageUrl) {
      enriched = { ...enriched, imageUrl };
    } else if (storeHtml) {
      enriched = {
        ...enriched,
        imageUrl: resolveProductImage(storeHtml, storeUrl, { slug }),
      };
    } else if (marketingHtml) {
      enriched = {
        ...enriched,
        imageUrl: resolveProductImage(marketingHtml, marketingUrl, { slug }),
      };
    }

    if (storeHtml && enriched.registeredPrice === undefined) {
      const priceMeta = parseMetaProductPrice(storeHtml);
      if (priceMeta) {
        enriched = {
          ...enriched,
          registeredPrice: registeredPriceUsd(
            priceMeta.amount,
            priceMeta.currency,
          ),
        };
      }
    }

    if (storeHtml && (!enriched.name || enriched.name === slug.replace(/-/g, " "))) {
      const title = parseTitleFromHtml(storeHtml);
      if (title) enriched = { ...enriched, name: title };
    }

    items.push({
      ...enriched,
      pageUrl: marketingUrl,
      isBundle: isBundleNameOrSlug(enriched.name, slug),
    });

    await new Promise((r) => setTimeout(r, 100));
  }

  return items;
}
