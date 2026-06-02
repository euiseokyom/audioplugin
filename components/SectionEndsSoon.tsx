import CardProduct from "@/components/CardProduct";
import SectionHeader from "@/components/SectionHeader";
import ButtonViewAll from "@/components/ButtonViewAll";
import type { ProductWithPrices } from "@/types";

interface Props {
  products: ProductWithPrices[];
}

export default function SectionEndsSoon({ products }: Props) {
  return (
    <section id="ends-soon" className="space-y-5">
      <SectionHeader title="Ends Soon" pullUp plain />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4 pt-4">
        {products.map((product) => (
          <CardProduct key={product._id} product={product} />
        ))}
      </div>

      <ButtonViewAll href="/search?filter=ends-soon" />
    </section>
  );
}
