import CardProduct from "@/components/CardProduct";
import EmptyState from "@/components/EmptyState";
import SectionHeader from "@/components/SectionHeader";
import ButtonViewAll from "@/components/ButtonViewAll";
import type { ProductWithPrices } from "@/types";

interface Props {
  products: ProductWithPrices[];
}

export default function SectionHotDeals({ products }: Props) {
  return (
    <section id="hot-deals" className="space-y-5">
      <SectionHeader title="Hot Deals" plain />

      {products.length === 0 ? (
        <EmptyState
          icon="🔥"
          title="No hot deals right now"
          description="Check back soon — we update prices daily. Browse all plugins in the meantime."
          actionLabel="Browse all plugins"
          actionHref="/search"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4 pt-4">
          {products.map((product) => (
            <CardProduct key={product._id} product={product} />
          ))}
        </div>
      )}

      {products.length > 0 && <ButtonViewAll href="/search?filter=hot" />}
    </section>
  );
}
