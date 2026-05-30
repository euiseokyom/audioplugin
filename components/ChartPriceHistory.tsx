"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PriceHistoryPoint } from "@/types";
import { RETAILER_MAP } from "@/lib/retailers";

interface Props {
  history: PriceHistoryPoint[];
}

const COLORS = [
  "#7c3aed",
  "#2563eb",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#9333ea",
];

export default function ChartPriceHistory({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-base-content/40 text-sm">
        No price history available yet.
      </div>
    );
  }

  // Group by date, pivot retailer prices into columns
  const dateMap = new Map<string, Record<string, number>>();
  const retailers = [...new Set(history.map((h) => h.retailerSlug))];

  for (const entry of history) {
    if (!dateMap.has(entry.date)) dateMap.set(entry.date, { date: entry.date as unknown as number });
    dateMap.get(entry.date)![entry.retailerSlug] = entry.price;
  }

  const chartData = Array.from(dateMap.values()).sort((a, b) =>
    String(a.date) < String(b.date) ? -1 : 1
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
          tickFormatter={(v) => {
            const d = new Date(v);
            return `${d.getMonth() + 1}/${d.getDate()}`;
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
          tickFormatter={(v) => `$${v}`}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--b2))",
            border: "1px solid hsl(var(--b3))",
            borderRadius: "12px",
            fontSize: "12px",
          }}
          formatter={(value, name) => [
            `$${(value as number).toFixed(2)}`,
            RETAILER_MAP[String(name)]?.name ?? String(name),
          ]}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Legend
          formatter={(value) => RETAILER_MAP[value]?.name ?? value}
          wrapperStyle={{ fontSize: "12px" }}
        />
        {retailers.map((slug, i) => (
          <Line
            key={slug}
            type="monotone"
            dataKey={slug}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
