"use client";

import { useState } from "react";
import Image from "next/image";
import type { IPriceEntry } from "@/types";
import { RETAILER_MAP } from "@/lib/retailers";

interface Props {
  prices: IPriceEntry[];
  surfaceClassName?: string;
  highlightedRowClassName?: string;
}

const LOGO_STYLES: Record<
  string,
  {
    scale?: string;
    bg?: string;
    fit?: "cover" | "contain";
    position?: string;
  }
> = {
  gear4music: {
    scale: "scale-[0.86] -translate-x-[1%] -translate-y-[3%]",
    bg: "bg-white",
    fit: "contain",
  },
  "plugin-fox": { scale: "scale-[0.96]", bg: "bg-black", fit: "contain" },
  "audio-deluxe": { scale: "scale-[1.52]" },
  thomann: { scale: "scale-[1.06]" },
  "plugin-boutique": { scale: "scale-[1.06]" },
  "best-service": {
    scale: "scale-[0.88] translate-x-[1%]",
    bg: "bg-white",
    fit: "contain",
  },
};

function RetailerLogo({
  logoUrl,
  name,
  slug,
}: {
  logoUrl?: string;
  name: string;
  slug: string;
}) {
  if (!logoUrl) {
    return (
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-200 text-[9px] font-bold text-base-content/50"
        aria-hidden
      >
        {name.charAt(0)}
      </div>
    );
  }

  const styles = LOGO_STYLES[slug];

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 ${styles?.bg ?? ""}`}
    >
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={32}
        height={32}
        className={`h-full w-full ${styles?.fit === "contain" ? "object-contain" : "object-cover"} ${styles?.scale ?? ""}`}
        style={
          styles?.position ? { objectPosition: styles.position } : undefined
        }
        unoptimized
      />
    </div>
  );
}

export default function RetailerPriceTable({
  prices,
  surfaceClassName = "bg-base-100",
  highlightedRowClassName = "bg-base-200",
}: Props) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  if (prices.length === 0) {
    return (
      <div className="border border-base-300 rounded-xl text-center py-8 text-base-content/40 text-sm">
        No retailer prices available yet.
      </div>
    );
  }

  return (
    <div
      className={`border border-base-300 rounded-xl overflow-hidden ${surfaceClassName}`}
    >
      <div
        className="divide-y divide-base-300"
        onPointerMove={(e) => {
          const row = (e.target as HTMLElement).closest<HTMLAnchorElement>(
            "[data-retailer-row]",
          );
          setHighlightedId(row?.dataset.retailerRow ?? null);
        }}
        onPointerLeave={() => setHighlightedId(null)}
      >
        {prices.map((entry, i) => {
          const retailer = entry.retailer ?? RETAILER_MAP[entry.retailerSlug];
          const isLowest = i === 0;
          const retailerName = retailer?.name ?? entry.retailerSlug;
          const isHighlighted = highlightedId === entry._id;

          return (
            <a
              key={entry._id}
              data-retailer-row={entry._id}
              href={entry.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={`flex w-full items-center gap-2.5 py-3 px-4 transition-colors touch-manipulation ${
                isHighlighted ? highlightedRowClassName : ""
              }`}
              onPointerDown={() => setHighlightedId(entry._id)}
            >
              <RetailerLogo
                logoUrl={retailer?.logoUrl}
                name={retailerName}
                slug={entry.retailerSlug}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs sm:text-sm truncate">
                    {retailerName}
                  </span>
                  {retailer?.isManufacturerDirect && (
                    <span className="badge badge-xs badge-outline text-[8px] sm:text-xs px-1.5 sm:px-2">
                      Official
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isLowest && (
                  <span className="rounded bg-red-500 px-1.5 sm:px-2 py-px sm:py-0.5 text-[7px] sm:text-[8px] font-medium text-white whitespace-nowrap">
                    LOWEST PRICE
                  </span>
                )}
                <span
                  className={`font-bold text-base ${isLowest ? "text-red-600" : ""}`}
                >
                  ${entry.price.toFixed(2)}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
