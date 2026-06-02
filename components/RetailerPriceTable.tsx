"use client";

import { useState } from "react";
import type { IPriceEntry } from "@/types";
import { RETAILER_MAP } from "@/lib/retailers";

interface Props {
  prices: IPriceEntry[];
}

const AVATAR_COLORS = [
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-orange-600",
];

function getAvatarColor(slug: string) {
  const index = slug
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

function RetailerAvatar({ name, slug }: { name: string; slug: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${getAvatarColor(slug)}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export default function RetailerPriceTable({ prices }: Props) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  if (prices.length === 0) {
    return (
      <div className="border border-base-300 rounded-xl text-center py-8 text-base-content/40 text-sm">
        No retailer prices available yet.
      </div>
    );
  }

  return (
    <div className="border border-base-300 rounded-xl overflow-hidden bg-base-100">
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
              className={`flex w-full items-center gap-4 py-3 px-4 transition-colors touch-manipulation ${
                isHighlighted ? "bg-base-200" : ""
              }`}
              onPointerDown={() => setHighlightedId(entry._id)}
            >
              <RetailerAvatar name={retailerName} slug={entry.retailerSlug} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {retailerName}
                  </span>
                  {retailer?.isManufacturerDirect && (
                    <span className="badge badge-xs badge-outline text-xs">
                      Official
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {isLowest && (
                  <span className="rounded bg-red-600 px-2 py-0.5 text-[8px] font-medium text-white whitespace-nowrap">
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
