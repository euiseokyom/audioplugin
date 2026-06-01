import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithPrices } from "@/types";
import CardProductActions from "@/components/CardProductActions";

interface Props {
  product: ProductWithPrices;
}

export default function CardProduct({ product }: Props) {
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
      className="group card bg-base-200 hover:shadow-card-hover transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <figure className="relative aspect-square overflow-hidden bg-base-300">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Badges — top left, stacked */}
        <div className="absolute top-0 left-0 flex flex-col gap-1 pt-0">
          {isEndingSoon && (
            <span className="text-xs font-extrabold px-2.5 py-1 bg-red-600 text-white leading-tight">
              ENDS SOON
            </span>
          )}
          {product.isAllTimeLow && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 text-white leading-tight bg-purple-700">
              Lowest Price
            </span>
          )}
        </div>

        {/* Alert + Favorite icons — top right */}
        <CardProductActions />
      </figure>

      {/* Content */}
      <div className="px-4 pt-3 pb-4 flex flex-col gap-1.5">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-base-content/50 font-extrabold truncate">
            {product.manufacturer}
          </p>
          <h3 className="font-normal text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Price rows — shared grid so % / price / retailer columns align across all rows */}
        <div className="mt-auto pt-1 flex flex-col gap-0.5">
          {hasDiscount && product.registeredPrice > 0 && (
            <span className="text-xs text-gray-500 line-through font-normal leading-none mb-0.5 text-right">
              ${product.registeredPrice.toFixed(2)}
            </span>
          )}
          <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-1.5 gap-y-0">
            {sortedPrices.map((entry, i) => {
              const retailerName = entry.retailer?.name ?? entry.retailerSlug;
              const isFirst = i === 0;

              if (isFirst) {
                return (
                  <Fragment key={entry._id}>
                    <span
                      className={`col-start-1 row-span-2 text-md font-bold leading-none shrink-0 self-start ${hasDiscount ? "text-red-600" : "invisible select-none"}`}
                    >
                      {hasDiscount ? `${product.discountPercent}%` : "0%"}
                    </span>
                    <div className="col-start-2 group/first flex flex-col items-end">
                      <span className="font-bold text-primary text-xl leading-none transition-colors duration-150 group-hover/first:text-blue-600">
                        ${entry.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-base-content/70 font-normal truncate leading-snug mb-1 transition-colors duration-150 group-hover/first:text-blue-600">
                        {retailerName}
                      </span>
                    </div>
                  </Fragment>
                );
              }

              return (
                <div
                  key={entry._id}
                  className="col-span-2 group/price flex items-baseline justify-between gap-1.5 opacity-50 transition-opacity duration-150 hover:opacity-100"
                >
                  <span className="text-xs text-base-content/50 truncate transition-colors duration-150 group-hover/price:text-blue-600">
                    {retailerName}
                  </span>
                  <span className="font-semibold text-primary text-sm shrink-0 transition-colors duration-150 group-hover/price:text-blue-600">
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
