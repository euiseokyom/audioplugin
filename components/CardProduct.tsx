import Link from "next/link";
import Image from "next/image";
import type { ProductWithPrices } from "@/types";

interface Props {
  product: ProductWithPrices;
}

export default function CardProduct({ product }: Props) {
  const hasDiscount = product.discountPercent > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group card bg-base-200 border border-base-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
    >
      {/* Image */}
      <figure className="relative aspect-[4/3] overflow-hidden bg-base-300">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {hasDiscount && (
          <div className="absolute top-2 left-2 badge badge-error text-xs font-bold px-2 py-2">
            -{product.discountPercent}%
          </div>
        )}
      </figure>

      {/* Content */}
      <div className="p-3 flex flex-col gap-1.5">
        <p className="text-xs text-base-content/50 font-medium truncate">{product.manufacturer}</p>
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-end gap-2 mt-auto pt-1">
          <span className="text-base font-bold text-primary">
            ${product.lowestPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-base-content/40 line-through">
              ${product.registeredPrice.toFixed(2)}
            </span>
          )}
        </div>

        {product.currentPrices.length > 1 && (
          <p className="text-xs text-base-content/40">
            {product.currentPrices.length} stores
          </p>
        )}
      </div>
    </Link>
  );
}
