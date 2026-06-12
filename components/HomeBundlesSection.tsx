import { getBundles } from "@/services/products";
import SectionBundles from "@/components/SectionBundles";

export default async function HomeBundlesSection() {
  let products: Awaited<ReturnType<typeof getBundles>>["data"] = [];

  try {
    const result = await getBundles(10);
    products = result.data;
  } catch {
    products = [];
  }

  return <SectionBundles products={products} />;
}
