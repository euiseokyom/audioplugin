import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/services/products";
import { getPriceHistory } from "@/services/prices";
import RetailerPriceTable from "@/components/RetailerPriceTable";
import ChartPriceHistory from "@/components/ChartPriceHistory";
import ButtonPriceAlert from "@/components/ButtonPriceAlert";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name} — Best Price | PluginBargains`,
    description: `Compare prices for ${product.name} by ${product.manufacturer} across 16 retailers. Currently from $${product.lowestPrice.toFixed(2)}.`,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, history] = await Promise.all([
    getProductBySlug(slug),
    getProductBySlug(slug).then((p) => (p ? getPriceHistory(p._id, 30) : [])),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Image */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-base-200 border border-base-300">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            {product.discountPercent > 0 && (
              <div className="absolute top-3 left-3 badge badge-error font-bold text-sm px-3 py-3">
                -{product.discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Price Summary Card */}
          <div className="bg-base-200 border border-base-300 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-base-300 rounded-xl p-3">
                <p className="text-xs text-base-content/50 mb-1">List Price</p>
                <p className="font-semibold">${product.registeredPrice.toFixed(2)}</p>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                <p className="text-xs text-base-content/50 mb-1">Best Price</p>
                <p className="font-bold text-primary">${product.lowestPrice.toFixed(2)}</p>
              </div>
              <div className="bg-base-300 rounded-xl p-3">
                <p className="text-xs text-base-content/50 mb-1">You Save</p>
                <p className="font-semibold text-success">
                  ${(product.registeredPrice - product.lowestPrice).toFixed(2)}
                </p>
              </div>
            </div>

            <ButtonPriceAlert
              productId={product._id}
              productName={product.name}
              currentLowestPrice={product.lowestPrice}
              registeredPrice={product.registeredPrice}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-3 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-outline text-xs">{product.category}</span>
              <span className="badge badge-outline text-xs">{product.manufacturer}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.description && (
              <p className="mt-3 text-base-content/60 leading-relaxed">{product.description}</p>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge badge-ghost text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Retailer Price Table */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Where to Buy</h2>
            <RetailerPriceTable
              prices={product.currentPrices}
              registeredPrice={product.registeredPrice}
            />
          </div>

          {/* Price History Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Price History (30 Days)</h2>
            </div>
            <div className="bg-base-200 border border-base-300 rounded-2xl p-4">
              <ChartPriceHistory history={history} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
