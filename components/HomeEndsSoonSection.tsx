import { getEndsSoonDeals } from "@/services/products";
import SectionEndsSoon from "@/components/SectionEndsSoon";

export default async function HomeEndsSoonSection() {
  let products: Awaited<ReturnType<typeof getEndsSoonDeals>>["data"] = [];

  try {
    const result = await getEndsSoonDeals(10);
    products = result.data;
  } catch {
    products = [];
  }

  return <SectionEndsSoon products={products} />;
}
