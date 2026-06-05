/**
 * Build catalog from a Shopify products.json endpoint.
 */

import {
  buildCatalogFile,
  type CatalogSourceItem,
} from "./official-catalog";
import {
  fetchAllShopifyProducts,
  isBundleProduct,
  normalizeShopifyProduct,
  registeredPriceFromVariants,
  shouldSkipShopifyProduct,
  type ShopifyProductJson,
} from "./shopify-catalog";
import { isBundleNameOrSlug } from "../../lib/catalog/catalog-category-map";
import type { ImageProcessingProfile } from "./process-product-image";

export type ShopifyCatalogOptions = {
  collectionUrl: string;
  manufacturer: string;
  manufacturerTag: string;
  exportName: string;
  generatedBy: string;
  outputFile: string;
  marketingBaseUrl: string;
  shouldInclude?: (product: ShopifyProductJson) => boolean;
  slugFromHandle?: (handle: string) => string;
  delayMs?: number;
  processingProfile?: ImageProcessingProfile;
};

function defaultInclude(product: ShopifyProductJson): boolean {
  const type = product.product_type.toLowerCase();
  if (
    /apparel|t-?shirt|hoodie|book|accessory|hardware|pedal|upgrade kit|dsp kit/i.test(
      type,
    )
  ) {
    return false;
  }
  if (/crossgrade|upgrade from/i.test(product.title)) return false;
  return true;
}

export async function buildFromShopifyProductsJson(
  options: ShopifyCatalogOptions,
): Promise<void> {
  const {
    collectionUrl,
    manufacturer,
    manufacturerTag,
    exportName,
    generatedBy,
    outputFile,
    marketingBaseUrl,
    shouldInclude = defaultInclude,
    slugFromHandle,
    delayMs = 50,
    processingProfile,
  } = options;

  console.log(`Fetching ${manufacturer} catalog from Shopify...`);
  const raw = await fetchAllShopifyProducts(collectionUrl);
  const filtered = raw.filter(
    (p) => !shouldSkipShopifyProduct(p) && shouldInclude(p),
  );

  const items: CatalogSourceItem[] = [];

  for (const product of filtered) {
    const item = normalizeShopifyProduct(product);
    const slug = slugFromHandle?.(item.slug) ?? item.slug;
    const isBundle =
      isBundleProduct(item.productType, item.tags) ||
      isBundleNameOrSlug(item.title, slug);

    items.push({
      name: item.title,
      slug,
      pageUrl: `${marketingBaseUrl.replace(/\/$/, "")}/${product.handle}`,
      registeredPrice: registeredPriceFromVariants(product.variants),
      imageUrl: item.imageUrl,
      isBundle,
      tags: item.tags.map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-")),
      categoryHint: item.productType,
    });
  }

  await buildCatalogFile({
    manufacturer,
    manufacturerTag,
    exportName,
    generatedBy,
    outputFile,
    items,
    delayMs,
    processingProfile,
  });
}
