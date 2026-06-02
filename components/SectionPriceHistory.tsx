"use client";

import { useState } from "react";
import ChartPriceHistory from "@/components/ChartPriceHistory";
import type { PriceHistoryPoint } from "@/types";

const PERIODS = [
  { months: 1, days: 30 },
  { months: 3, days: 90 },
  { months: 6, days: 180 },
  { months: 12, days: 365 },
] as const;

interface Props {
  slug: string;
  initialHistory: PriceHistoryPoint[];
}

export default function SectionPriceHistory({ slug, initialHistory }: Props) {
  const [selectedMonths, setSelectedMonths] = useState<(typeof PERIODS)[number]["months"]>(1);
  const [history, setHistory] = useState(initialHistory);
  const [isLoading, setIsLoading] = useState(false);

  async function handlePeriodChange(months: (typeof PERIODS)[number]["months"], days: number) {
    if (months === selectedMonths || isLoading) return;

    setSelectedMonths(months);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/products/${slug}/history?days=${days}`);
      if (res.ok) {
        const data: PriceHistoryPoint[] = await res.json();
        setHistory(data);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Price History</h2>
        <div className="flex gap-1" role="group" aria-label="Price history period">
          {PERIODS.map(({ months, days }) => (
            <button
              key={months}
              type="button"
              onClick={() => handlePeriodChange(months, days)}
              disabled={isLoading}
              aria-pressed={selectedMonths === months}
              className={`btn btn-sm btn-ghost rounded-full px-3 border ${
                selectedMonths === months
                  ? "border-black text-base-content"
                  : "border-transparent"
              }`}
            >
              {months} mo
            </button>
          ))}
        </div>
      </div>

      <div
        className={`bg-base-200 border border-base-300 rounded-2xl p-4 transition-opacity ${
          isLoading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <ChartPriceHistory history={history} />
      </div>
    </div>
  );
}
