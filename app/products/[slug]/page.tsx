import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/services/products";
import { getPriceHistory } from "@/services/prices";
import RetailerPriceTable from "@/components/RetailerPriceTable";
import SectionPriceHistory from "@/components/SectionPriceHistory";
import ButtonPriceAlert from "@/components/ButtonPriceAlert";
import { PAGE_CONTAINER } from "@/lib/layout";

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

function formatDealEndDate(dealEndsAt?: string) {
  if (!dealEndsAt) return null;
  const end = new Date(dealEndsAt);
  if (end.getTime() <= Date.now()) return null;
  return end.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  const dealEndDate = formatDealEndDate(product.dealEndsAt);

  return (
    <div className={`${PAGE_CONTAINER} py-12 lg:py-16`}>
      {/* On desktop: 3-column layout [image | details | where-to-buy].
          On mobile/tablet: image+details side-by-side, where-to-buy below. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,420px)] lg:gap-10 xl:gap-14 lg:items-start space-y-10 lg:space-y-0">
        {/* Image + details wrapper:
            - Mobile/tablet: 2-col grid so they sit side by side
            - Desktop: lg:contents dissolves this wrapper, making image and
              details direct children of the outer 3-col grid */}
        <div className="grid grid-cols-[minmax(0,200px)_1fr] sm:grid-cols-[minmax(0,280px)_1fr] md:grid-cols-[minmax(260px,340px)_1fr] gap-4 sm:gap-6 md:gap-8 items-start lg:contents">
          <div className="relative aspect-square w-full min-w-0 self-start rounded-2xl overflow-hidden bg-base-200 border border-base-300">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 200px, (max-width: 768px) 280px, (max-width: 1024px) 340px, 320px"
            />
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 min-w-0 self-start text-right items-end">
            <div className="flex flex-col gap-0.5 w-full">
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {product.name}
              </h1>
              <p className="text-sm sm:text-base text-base-content/60 font-medium">
                {product.manufacturer}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3 pt-0 sm:pt-1 items-end w-full">
              <div className="flex flex-col gap-1 items-end">
                <div>
                  <p className="text-xs font-medium text-base-content mb-0.5">
                    List Price
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold">
                    ${product.registeredPrice.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-red-600 mb-0.5">Lowest Price</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    ${product.lowestPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-base-content mb-0.5">
                  Sale Ends
                </p>
                <p className="text-sm sm:text-base font-medium">
                  {dealEndDate ?? "No end date listed"}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <ButtonPriceAlert
                productId={product._id}
                productName={product.name}
                currentLowestPrice={product.lowestPrice}
                registeredPrice={product.registeredPrice}
              />
            </div>
          </div>
        </div>

        {/* Where to Buy — col 3 on desktop, full-width below on mobile/tablet */}
        <div>
          <RetailerPriceTable prices={product.currentPrices} />
        </div>
      </div>

      {/* Price history — full width */}
      <div className="mt-12 lg:mt-14">
        <SectionPriceHistory slug={slug} initialHistory={history} />
      </div>
    </div>
  );
}
