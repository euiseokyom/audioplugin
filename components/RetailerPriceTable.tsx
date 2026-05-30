import type { IPriceEntry } from "@/types";
import { RETAILER_MAP } from "@/lib/retailers";

interface Props {
  prices: IPriceEntry[];
  registeredPrice: number;
}

export default function RetailerPriceTable({ prices, registeredPrice }: Props) {
  if (prices.length === 0) {
    return (
      <div className="text-center py-8 text-base-content/40 text-sm">
        No retailer prices available yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {prices.map((entry, i) => {
        const retailer = entry.retailer ?? RETAILER_MAP[entry.retailerSlug];
        const isLowest = i === 0;
        const discount = Math.round(((registeredPrice - entry.price) / registeredPrice) * 100);
        const hasDiscount = discount > 0;

        return (
          <a
            key={entry._id}
            href={entry.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all hover:scale-[1.01] group ${
              isLowest
                ? "border-primary/50 bg-primary/5 hover:bg-primary/10"
                : "border-base-300 bg-base-200 hover:bg-base-300"
            }`}
          >
            {/* Retailer name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {retailer?.name ?? entry.retailerSlug}
                </span>
                {retailer?.isManufacturerDirect && (
                  <span className="badge badge-xs badge-outline text-xs">Official</span>
                )}
                {isLowest && (
                  <span className="badge badge-xs badge-success text-xs">Lowest</span>
                )}
              </div>
            </div>

            {/* Discount */}
            {hasDiscount && (
              <span className="text-xs font-medium text-error shrink-0">-{discount}%</span>
            )}

            {/* Price */}
            <div className="text-right shrink-0">
              <span className={`font-bold text-base ${isLowest ? "text-primary" : ""}`}>
                ${entry.price.toFixed(2)}
              </span>
            </div>

            {/* Arrow */}
            <svg
              className="w-4 h-4 text-base-content/30 group-hover:text-primary transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
