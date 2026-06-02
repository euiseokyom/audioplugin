import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithPrices } from "@/types";
import CardProductActions from "@/components/CardProductActions";

interface Props {
  product: ProductWithPrices;
  plain?: boolean;
  compactContent?: boolean;
}

export default function CardProduct({
  product,
  plain = true,
  compactContent = true,
}: Props) {
  const hasDiscount = product.discountPercent > 0;

  const sortedPrices = [...product.currentPrices]
    .sort((a, b) => a.price - b.price)
    .slice(0, 1);

  const now = Date.now();
  const isEndingSoon =
    !!product.dealEndsAt &&
    new Date(product.dealEndsAt).getTime() > now &&
    new Date(product.dealEndsAt).getTime() - now <= 48 * 60 * 60 * 1000;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group card min-w-0 transition-all duration-200 overflow-hidden rounded-lg${plain ? "" : " bg-base-200"}`}
    >
      {/* Image */}
      <figure className="relative aspect-square overflow-hidden bg-base-300 rounded-lg">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges — top left, stacked */}
        <div className="absolute top-0 left-0 flex flex-col gap-1 pt-0">
          {isEndingSoon && (
            <span className="text-xs font-extrabold px-2.5 py-1 bg-red-600 text-white leading-tight rounded-br-lg">
              ENDS SOON
            </span>
          )}
          {product.isAllTimeLow && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 text-white leading-tight bg-red-600 rounded-br-lg">
              Lowest Price
            </span>
          )}
        </div>

        {/* Alert + Favorite icons — top right */}
        <CardProductActions />
      </figure>

      {/* Content */}
      <div
        className={`min-w-0 pt-3 pb-4 flex flex-col gap-0.5 ${compactContent ? "px-2" : "px-4"}`}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs text-base-content/80 font-extrabold truncate">
            {product.manufacturer}
          </p>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          {hasDiscount && product.registeredPrice > 0 && (
            <span className="mt-1 text-xs text-base-content/60 line-through font-medium leading-none text-right">
              ${product.registeredPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Price rows — shared grid so % / price / retailer columns align across all rows */}
        <div className="mt-auto flex flex-col gap-0.5 min-w-0">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-1.5 gap-y-0 min-w-0">
            {sortedPrices.map((entry) => {
              const retailerName = entry.retailer?.name ?? entry.retailerSlug;
              const percentLabel = hasDiscount
                ? `${product.discountPercent}%`
                : "0%";

              return (
                <Fragment key={entry._id}>
                  {/* Spacer matches price line height; % sits out of flow so row 1 stays compact */}
                  <div className="col-start-1 row-start-1 relative shrink-0">
                    <span
                      className="invisible block text-xl font-bold leading-none"
                      aria-hidden
                    >
                      {percentLabel}
                    </span>
                    <span
                      className={`absolute left-0 bottom-0 text-2xl font-bold leading-none ${hasDiscount ? "text-red-600" : "invisible select-none"}`}
                    >
                      {percentLabel}
                    </span>
                  </div>
                  <div className="col-start-2 row-start-1 row-span-2 group/price flex min-w-0 flex-col gap-0">
                    <span className="font-bold text-primary text-xl leading-none text-right transition-colors duration-150 group-hover/price:text-blue-700">
                      ${entry.price.toFixed(2)}
                    </span>
                    <span className="w-full min-w-0 text-sm text-primary font-normal truncate text-right leading-snug mb-1 transition-colors duration-150 group-hover/price:text-blue-700">
                      {retailerName}
                    </span>
                  </div>
                </Fragment>
              );
            })}
            <div className="col-span-2 flex min-w-0 flex-col gap-0.5 mt-0.5">
              <span className="inline-flex w-fit items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase bg-green-600 text-base-100 leading-tight">
                Recently Added
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
