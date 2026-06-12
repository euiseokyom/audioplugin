import CardProduct from "@/components/CardProduct";
import EmptyState from "@/components/EmptyState";
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

      {products.length === 0 ? (
        <EmptyState
          icon="⏰"
          title="No deals ending soon"
          description="Nothing is expiring in the next 48 hours. Browse all plugins or check hot deals instead."
          actionLabel="View hot deals"
          actionHref="/search?filter=hot"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4 pt-4">
          {products.map((product) => (
            <CardProduct key={product._id} product={product} />
          ))}
        </div>
      )}

      {products.length > 0 && (
        <ButtonViewAll href="/search?filter=ends-soon" />
      )}
    </section>
  );
}
