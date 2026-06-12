import { getHotDeals } from "@/services/products";
import SectionHotDeals from "@/components/SectionHotDeals";

export default async function HomeHotDealsSection() {
  let products: Awaited<ReturnType<typeof getHotDeals>>["data"] = [];

  try {
    const result = await getHotDeals(10);
    products = result.data;
  } catch {
    products = [];
  }

  return <SectionHotDeals products={products} />;
}
