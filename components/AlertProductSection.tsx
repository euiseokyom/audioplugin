import Image from "next/image";
import Link from "next/link";
import { manufacturerToSlug } from "@/lib/manufacturer-slug";
import RetailerPriceTable from "@/components/RetailerPriceTable";
import ButtonPriceAlert from "@/components/ButtonPriceAlert";
import AlertTargetField from "@/components/AlertTargetField";
import type { AlertWithProduct } from "@/types";

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

interface Props {
  alert: AlertWithProduct;
}

function ProductHeading({
  product,
  className = "",
}: {
  product: AlertWithProduct["product"];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 w-full min-w-0 ${className}`}>
      <Link
        href={`/products/${product.slug}`}
        className="block w-full min-w-0 text-left sm:text-right text-lg sm:text-2xl md:text-3xl font-bold tracking-tight leading-tight hover:text-primary transition-colors"
      >
        {product.name}
      </Link>
      <Link
        href={`/manufacturer/${manufacturerToSlug(product.manufacturer)}`}
        className="block w-full min-w-0 text-left sm:text-right text-sm sm:text-base text-base-content/60 font-medium hover:text-primary transition-colors"
      >
        {product.manufacturer}
      </Link>
    </div>
  );
}

export default function AlertProductSection({ alert }: Props) {
  const { product } = alert;
  const dealEndDate = formatDealEndDate(product.dealEndsAt);

  return (
    <article className="rounded-2xl border border-base-300 bg-base-200 p-4 sm:p-6 lg:p-8 overflow-hidden">
      <div className="lg:grid lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,420px)] lg:gap-10 xl:gap-14 lg:items-start space-y-10 lg:space-y-0">
        <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,280px)_1fr] md:grid-cols-[minmax(260px,340px)_1fr] sm:gap-6 md:gap-8 sm:items-start lg:contents">
          <ProductHeading product={product} className="sm:hidden" />

          <Link
            href={`/products/${product.slug}`}
            className="relative aspect-square w-full min-w-0 self-start rounded-2xl overflow-hidden bg-base-100 border border-base-300 block"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 280px, (max-width: 1024px) 340px, 320px"
            />
          </Link>

          <div className="grid grid-cols-2 gap-x-4 items-stretch w-full min-w-0 px-2 pb-2 sm:px-0 sm:pb-0 sm:flex sm:flex-col sm:gap-4 sm:text-right sm:items-end">
            <div className="flex flex-col gap-2.5 min-w-0 sm:items-end sm:w-full">
              <ProductHeading product={product} className="hidden sm:flex sm:flex-col sm:items-end" />

              <div className="flex flex-col gap-1 sm:items-end w-full">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-base-content mb-0.5 sm:mb-0 leading-none">
                    List Price
                  </p>
                  <p className="text-base sm:text-xl md:text-2xl font-semibold leading-none tabular-nums">
                    ${product.registeredPrice.toFixed(2)}
                  </p>
                </div>

                <div className="mt-0.5 sm:mt-0">
                  <p className="text-[10px] sm:text-xs text-red-600 mb-0.5 sm:mb-0 leading-none">
                    Lowest Price
                  </p>
                  <p className="text-base sm:text-xl md:text-2xl font-bold text-red-600 leading-none tabular-nums">
                    ${product.lowestPrice.toFixed(2)}
                  </p>
                </div>

                <AlertTargetField
                  alertId={alert._id}
                  targetPrice={alert.targetPrice}
                  lowestPrice={product.lowestPrice}
                  maxPrice={product.registeredPrice}
                  className="mt-2 w-fit max-w-full sm:mt-2.5 sm:w-auto"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end items-end gap-2.5 text-right min-w-0 h-full sm:h-auto sm:w-full sm:justify-start">
              <div>
                <p className="text-xs font-medium text-base-content mb-0.5">
                  Sale Ends
                </p>
                <p className="text-sm sm:text-base font-medium">
                  {dealEndDate ?? "No end date listed"}
                </p>
              </div>

              <div className="pt-0 sm:pt-2">
                <ButtonPriceAlert
                  productId={product._id}
                  productName={product.name}
                  currentLowestPrice={product.lowestPrice}
                  registeredPrice={product.registeredPrice}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <RetailerPriceTable prices={product.currentPrices} />
        </div>
      </div>
    </article>
  );
}
