import { notFound } from "next/navigation";
import { getProducts } from "@/services/products";
import { getCategories } from "@/services/categories";
import CardProduct from "@/components/CardProduct";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return {
    title: `${name} Plugins — Deals & Prices | PluginBargains`,
    description: `Browse the best deals on ${name} audio plugins. Compare prices across 16 retailers.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoryName = decodeURIComponent(slug);

  const [result, allCategories] = await Promise.all([
    getProducts({ category: categoryName, pageSize: 40 }),
    getCategories(),
  ]);

  const matchedCategory = allCategories.find(
    (c) => c.name.toLowerCase() === categoryName.toLowerCase()
  );

  if (!matchedCategory && result.data.length === 0) notFound();

  const displayName = matchedCategory?.name ?? categoryName;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm text-base-content/50 mb-3">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <span>/</span>
          <span>Categories</span>
          <span>/</span>
          <span className="text-base-content">{displayName}</span>
        </div>
        <h1 className="text-3xl font-bold">{displayName}</h1>
        <p className="text-base-content/50 mt-1">{result.total} plugins</p>
      </div>

      {result.data.length === 0 ? (
        <div className="text-center py-20 text-base-content/40">
          No plugins found in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-start gap-3 sm:gap-4">
          {result.data.map((product) => (
            <CardProduct key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
