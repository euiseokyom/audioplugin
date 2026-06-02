"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductFilter, ProductSort } from "@/services/products";
import {
  buildSearchUrl,
  FILTER_OPTIONS,
  getFilterButtonLabel,
  toggleFilter,
} from "@/lib/search-filters";

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "price-asc", label: "Price: Low–High" },
  { value: "price-desc", label: "Price: High–Low" },
  { value: "newest", label: "Newest" },
  { value: "ending-soon", label: "Ending Soon" },
];

const DROPDOWN_MENU_CLASS =
  "absolute top-full mt-2 menu bg-base-200 rounded-xl z-[1] w-52 p-2 shadow-2xl border border-base-300";

const FILTER_DROPDOWN_MENU_CLASS =
  "absolute top-full mt-2 menu bg-base-200 rounded-xl z-[1] w-52 p-2 border border-base-300";

function filtersEqual(a: ProductFilter[], b: ProductFilter[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((f) => b.includes(f));
}

function ChevronDownIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 opacity-60"
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
  q,
  sort,
  filters,
}: {
  q: string;
  sort: ProductSort;
  filters: ProductFilter[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState(filters);

  useEffect(() => {
    setPendingFilters(filters);
  }, [filters]);

  useClickOutside(
    containerRef,
    () => {
      setPendingFilters(filters);
      setIsOpen(false);
    },
    isOpen,
  );

  function closeDropdown() {
    setPendingFilters(filters);
    setIsOpen(false);
  }

  function applyFilters(nextFilters: ProductFilter[]) {
    router.replace(buildSearchUrl({ q, sort, filters: nextFilters }), {
      scroll: false,
    });
    setIsOpen(false);
  }

  const hasPendingChanges = !filtersEqual(pendingFilters, filters);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="btn btn-sm btn-ghost gap-2 pl-3 pr-2.5 font-normal border border-base-300 text-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm text-base-content/50">Filter:</span>
        <span className="text-sm">{getFilterButtonLabel(filters)}</span>
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

          <div className="mt-2 flex gap-2 border-t border-base-300 pt-2">
            {filters.length > 0 && (
              <button
                type="button"
                onClick={() => applyFilters([])}
                className="flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm hover:bg-base-300 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() => applyFilters(pendingFilters)}
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
  q,
  sort,
  filters,
}: {
  q: string;
  sort: ProductSort;
  filters: ProductFilter[];
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  function selectSort(value: ProductSort) {
    router.replace(buildSearchUrl({ q, sort: value, filters }), {
      scroll: false,
    });
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="btn btn-sm btn-ghost gap-2 pl-3 pr-2.5 font-normal border border-base-300 text-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-sm text-base-content/50">Sort:</span>
        <span className="text-sm">{activeSortLabel}</span>
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
  q,
  sort,
  filters,
}: {
  q: string;
  sort: ProductSort;
  filters: ProductFilter[];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <FilterDropdown q={q} sort={sort} filters={filters} />
      <SortDropdown q={q} sort={sort} filters={filters} />
    </div>
  );
}
