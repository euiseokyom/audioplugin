import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PAGE_CONTAINER } from "@/lib/layout";
import { absoluteUrl } from "@/lib/site-url";
import { getUserFavoriteProducts } from "@/services/favorites";
import SectionHeader from "@/components/SectionHeader";
import EmptyState from "@/components/EmptyState";
import CardProduct from "@/components/CardProduct";
import { DEAL_GRID_CLASS } from "@/components/DealGridSkeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Favorites",
  description: "View your saved audio plugin favorites.",
  alternates: { canonical: absoluteUrl("/favorites") },
};

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const products = await getUserFavoriteProducts(session.user.id);

  return (
    <div className={`${PAGE_CONTAINER} pt-8 pb-10`}>
      <SectionHeader
        title="My Favorites"
        plain
        compact
      />

      <div className="mt-6">
        {products.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="No favorites yet"
            description="Tap the heart on any plugin to save it here."
            actionLabel="Browse plugins"
            actionHref="/search"
          />
        ) : (
          <div className={DEAL_GRID_CLASS}>
            {products.map((product) => (
              <CardProduct
                key={product._id}
                product={product}
                initialIsFavorited
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
