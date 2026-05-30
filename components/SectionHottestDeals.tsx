import CardProduct from "@/components/CardProduct";
import type { ProductWithPrices } from "@/types";

interface Props {
  products: ProductWithPrices[];
}

export default function SectionHottestDeals({ products }: Props) {
  return (
    <section id="deals" className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <h2 className="text-xl font-bold">Hottest Deals</h2>
        </div>
        <div className="h-px flex-1 bg-base-300" />
        <a href="/search?sort=deals" className="text-sm text-primary hover:underline shrink-0">
          View all
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <CardProduct key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
