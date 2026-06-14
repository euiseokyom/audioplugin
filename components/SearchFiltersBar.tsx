"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductFilter, ProductSort } from "@/services/products";
import {
  BROWSE_SORT_OPTIONS,
  buildBrowseUrl,
  FILTER_OPTIONS,
  getFilterButtonLabel,
  hasPriceRange,
  normalizePriceRange,
  PRICE_RANGE_MAX,
  priceRangesEqual,
  toggleFilter,
  type PriceRange,
} from "@/lib/search-filters";

const SORT_LABELS: Record<ProductSort, string> = {
  deals: "Best Deals",
  bestseller: "Bestseller",
  "price-asc": "Price: Low–High",
  "price-desc": "Price: High–Low",
  newest: "Newest",
  "ending-soon": "Ending Soon",
};

const SORT_OPTIONS = BROWSE_SORT_OPTIONS.map((value) => ({
  value,
  label: SORT_LABELS[value],
}));

const DROPDOWN_MENU_CLASS =
  "absolute top-full mt-2 menu bg-base-200 rounded-xl z-[1] w-52 p-2 shadow-2xl border border-base-300";

const FILTER_DROPDOWN_MENU_CLASS =
  "absolute top-full mt-2 menu bg-base-200 rounded-xl z-[1] w-64 p-2 border border-base-300";

function filtersEqual(a: ProductFilter[], b: ProductFilter[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((f) => b.includes(f));
}

const PRICE_INPUT_CLASS =
  "input input-sm w-full pl-6 pr-2.5 [&::-webkit-inner-spin-button]:mr-px [&::-webkit-outer-spin-button]:mr-px";

function parsePriceInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > PRICE_RANGE_MAX) {
    return undefined;
  }

  return Math.round(parsed * 100) / 100;
}

function PriceRangeInputs({
  value,
  onChange,
}: {
  value: PriceRange;
  onChange: (next: PriceRange) => void;
}) {
  return (
    <div className="border-t border-base-300 pt-2 mt-2">
      <p className="px-3 py-1 text-xs text-base-content/50">Price range</p>
      <div className="flex items-center gap-2 px-3 py-2">
        <label className="flex-1 min-w-0">
          <span className="sr-only">Minimum price</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-base-content/50">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={PRICE_RANGE_MAX}
              step="1"
              value={value.min ?? ""}
              onChange={(event) =>
                onChange({ ...value, min: parsePriceInput(event.target.value) })
              }
              placeholder="Min"
              className={PRICE_INPUT_CLASS}
            />
          </div>
        </label>
        <span className="text-base-content/30" aria-hidden>
          –
        </span>
        <label className="flex-1 min-w-0">
          <span className="sr-only">Maximum price</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-base-content/50">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={PRICE_RANGE_MAX}
              step="1"
              value={value.max ?? ""}
              onChange={(event) =>
                onChange({ ...value, max: parsePriceInput(event.target.value) })
              }
              placeholder="Max"
              className={PRICE_INPUT_CLASS}
            />
          </div>
        </label>
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-60"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  onOutside: () => void,
  isActive: boolean,
) {
  useEffect(() => {
    if (!isActive) return;

    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutside();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, onOutside, isActive]);
}

function FilterDropdown({
  basePath,
  q,
  sort,
  filters,
  priceRange,
}: {
  basePath: string;
  q: string;
  sort: ProductSort;
  filters: ProductFilter[];
  priceRange: PriceRange;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [pendingPriceRange, setPendingPriceRange] = useState(priceRange);

  useEffect(() => {
    setPendingFilters(filters);
    setPendingPriceRange(priceRange);
  }, [filters, priceRange]);

  useClickOutside(
    containerRef,
    () => {
      setPendingFilters(filters);
      setPendingPriceRange(priceRange);
      setIsOpen(false);
    },
    isOpen,
  );

  function closeDropdown() {
    setPendingFilters(filters);
    setPendingPriceRange(priceRange);
    setIsOpen(false);
  }

  function applyFilters(
    nextFilters: ProductFilter[],
    nextPriceRange: PriceRange,
  ) {
    router.replace(
      buildBrowseUrl({
        basePath,
        q,
        sort,
        filters: nextFilters,
        priceRange: normalizePriceRange(nextPriceRange),
      }),
      { scroll: false },
    );
    setIsOpen(false);
  }

  const hasPendingChanges =
    !filtersEqual(pendingFilters, filters) ||
    !priceRangesEqual(pendingPriceRange, priceRange);
  const hasActiveFilters =
    filters.length > 0 || hasPriceRange(priceRange);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="btn btn-sm btn-ghost gap-1 sm:gap-2 pl-1.5 sm:pl-3 pr-1 sm:pr-2.5 min-h-0 h-8 sm:h-9 font-normal border border-base-300 text-xs sm:text-sm whitespace-nowrap"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-xs sm:text-sm text-base-content/50">Filter:</span>
        <span className="text-xs sm:text-sm">
          {getFilterButtonLabel(filters, priceRange)}
        </span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <div className={`${FILTER_DROPDOWN_MENU_CLASS} left-0`}>
          <ul role="listbox" aria-multiselectable="true">
            {FILTER_OPTIONS.map(({ value, label }) => {
              const isActive = pendingFilters.includes(value);
              return (
                <li key={value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() =>
                      setPendingFilters(toggleFilter(pendingFilters, value))
                    }
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-base-300 ${isActive ? "font-medium" : ""}`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center ${isActive ? "text-primary" : "text-transparent"}`}
                    >
                      <CheckIcon />
                    </span>
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>

          <PriceRangeInputs
            value={pendingPriceRange}
            onChange={setPendingPriceRange}
          />

          <div className="mt-2 flex gap-2 border-t border-base-300 pt-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => applyFilters([], {})}
                className="flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm hover:bg-base-300 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                applyFilters(pendingFilters, pendingPriceRange)
              }
              disabled={!hasPendingChanges}
              className={`flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm hover:bg-base-300 transition-colors disabled:opacity-50 disabled:pointer-events-none ${hasPendingChanges ? "font-medium" : ""}`}
            >
              Apply
            </button>
          </div>

          {hasPendingChanges && (
            <button
              type="button"
              onClick={closeDropdown}
              className="mt-2.5 flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm hover:bg-base-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SortDropdown({
  basePath,
  q,
  sort,
  filters,
  priceRange,
}: {
  basePath: string;
  q: string;
  sort: ProductSort;
  filters: ProductFilter[];
  priceRange: PriceRange;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  function selectSort(value: ProductSort) {
    router.replace(
      buildBrowseUrl({ basePath, q, sort: value, filters, priceRange }),
      { scroll: false },
    );
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="btn btn-sm btn-ghost gap-1 sm:gap-2 pl-1.5 sm:pl-3 pr-1 sm:pr-2.5 min-h-0 h-8 sm:h-9 font-normal border border-base-300 text-xs sm:text-sm whitespace-nowrap"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-xs sm:text-sm text-base-content/50">Sort:</span>
        <span className="text-xs sm:text-sm">{activeSortLabel}</span>
        <ChevronDownIcon />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className={`${DROPDOWN_MENU_CLASS} right-0`}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <li key={value}>
              <button
                type="button"
                role="option"
                aria-selected={sort === value}
                onClick={() => selectSort(value)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-base-300 ${sort === value ? "bg-base-300 font-medium" : ""}`}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchFiltersBar({
  basePath = "/search",
  q = "",
  sort,
  filters,
  priceRange = {},
}: {
  basePath?: string;
  q?: string;
  sort: ProductSort;
  filters: ProductFilter[];
  priceRange?: PriceRange;
}) {
  return (
    <div className="flex items-center justify-between gap-1.5 sm:gap-4">
      <FilterDropdown
        basePath={basePath}
        q={q}
        sort={sort}
        filters={filters}
        priceRange={priceRange}
      />
      <SortDropdown
        basePath={basePath}
        q={q}
        sort={sort}
        filters={filters}
        priceRange={priceRange}
      />
    </div>
  );
}
