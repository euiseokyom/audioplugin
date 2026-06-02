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
  plain = false,
  compactContent = false,
}: Props) {
  const hasDiscount = product.discountPercent > 0;

  const sortedPrices = [...product.currentPrices]
    .sort((a, b) => a.price - b.price)
    .slice(0, 3);

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
        className={`min-w-0 pt-3 pb-4 flex flex-col gap-1.5 ${compactContent ? "px-2" : "px-4"}`}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-xs text-base-content/80 font-extrabold truncate">
            {product.manufacturer}
          </p>
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
        </div>

        {/* Price rows — shared grid so % / price / retailer columns align across all rows */}
        <div className="mt-auto pt-1 flex flex-col gap-0.5 min-w-0">
          {hasDiscount && product.registeredPrice > 0 && (
            <span className="text-xs text-base-content/60 line-through font-medium leading-none mb-0.5 text-right">
              ${product.registeredPrice.toFixed(2)}
            </span>
          )}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-1.5 gap-y-0 min-w-0">
            {sortedPrices.map((entry, i) => {
              const retailerName = entry.retailer?.name ?? entry.retailerSlug;
              const isFirst = i === 0;

              if (isFirst) {
                return (
                  <Fragment key={entry._id}>
                    <span
                      className={`col-start-1 row-span-2 text-base sm:text-lg font-bold leading-none shrink-0 self-start ${hasDiscount ? "text-red-600" : "invisible select-none"}`}
                    >
                      {hasDiscount ? `${product.discountPercent}%` : "0%"}
                    </span>
                    <div className="col-start-2 group/first flex min-w-0 w-full flex-col items-end">
                      <span className="font-bold text-primary-content text-xl leading-none transition-colors duration-150 group-hover/first:text-primary">
                        ${entry.price.toFixed(2)}
                      </span>
                      <span className="w-full min-w-0 text-sm text-secondary-content font-normal truncate text-right leading-snug mb-1 transition-colors duration-150 group-hover/first:text-primary">
                        {retailerName}
                      </span>
                    </div>
                  </Fragment>
                );
              }

              return (
                <div
                  key={entry._id}
                  className={`col-span-2 group/price flex min-w-0 items-baseline justify-between gap-1.5 opacity-60 transition-opacity duration-150 hover:opacity-100${i === 2 ? " -mt-0.5" : ""}`}
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-base-content transition-colors duration-150 group-hover/price:text-primary">
                    {retailerName}
                  </span>
                  <span className="shrink-0 font-semibold text-base-content text-sm transition-colors duration-150 group-hover/price:text-primary">
                    ${entry.price.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
