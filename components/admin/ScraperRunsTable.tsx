"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDuration } from "@/lib/format-time";
import { hasProductChangeStats, runErrorCount } from "@/lib/scraper-log-utils";
import { RETAILER_MAP } from "@/lib/retailers";
import type { IScraperLog } from "@/types";

function retailerName(slug: string): string {
  return RETAILER_MAP[slug]?.name ?? slug;
}

const STATUS_BADGE: Record<string, string> = {
  success: "badge-success",
  failed: "badge-error",
  partial: "badge-warning",
  running: "badge-info",
  pending: "badge-ghost",
};

type SortKey =
  | "startedAt"
  | "status"
  | "duration"
  | "retailerSlug"
  | "itemsScraped"
  | "errors";
type SortDir = "asc" | "desc";

const NUMERIC_SORT_KEYS: SortKey[] = ["startedAt", "duration", "itemsScraped", "errors"];

interface ScraperRunsTableProps {
  runs: IScraperLog[];
}

function runDurationSeconds(run: IScraperLog): number | null {
  if (!run.finishedAt) return null;
  return Math.round(
    (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
  );
}

export default function ScraperRunsTable({ runs }: ScraperRunsTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("startedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(NUMERIC_SORT_KEYS.includes(key) ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = runs;

    if (q) {
      list = runs.filter((run) => {
        const name = retailerName(run.retailerSlug).toLowerCase();
        return (
          name.includes(q) ||
          run.retailerSlug.includes(q) ||
          run.status.includes(q)
        );
      });
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "startedAt") {
        cmp =
          new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else if (sortKey === "duration") {
        cmp = (runDurationSeconds(a) ?? -1) - (runDurationSeconds(b) ?? -1);
      } else if (sortKey === "retailerSlug") {
        cmp = retailerName(a.retailerSlug).localeCompare(
          retailerName(b.retailerSlug)
        );
      } else if (sortKey === "itemsScraped") {
        cmp = (a.itemsScraped ?? 0) - (b.itemsScraped ?? 0);
      } else if (sortKey === "errors") {
        cmp = runErrorCount(a) - runErrorCount(b);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [runs, search, sortKey, sortDir]);

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-12 text-base-content/40 bg-base-200 rounded-xl border border-base-300">
        <p className="text-3xl mb-2">📋</p>
        <p>No scraper runs yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search by retailer or status…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input input-sm input-bordered w-full max-w-xs bg-base-100"
      />

      <div className="overflow-x-auto rounded-xl border border-base-300">
        <table className="table table-sm w-full">
          <thead>
            <tr className="bg-base-200">
              <th>
                <button
                  type="button"
                  className="font-semibold hover:text-primary"
                  onClick={() => toggleSort("startedAt")}
                >
                  Date/Time{sortIndicator("startedAt")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="font-semibold hover:text-primary"
                  onClick={() => toggleSort("retailerSlug")}
                >
                  Retailer{sortIndicator("retailerSlug")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="font-semibold hover:text-primary"
                  onClick={() => toggleSort("status")}
                >
                  Status{sortIndicator("status")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="font-semibold hover:text-primary"
                  onClick={() => toggleSort("duration")}
                >
                  Duration{sortIndicator("duration")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="font-semibold hover:text-primary"
                  onClick={() => toggleSort("itemsScraped")}
                >
                  Items{sortIndicator("itemsScraped")}
                </button>
              </th>
              <th>
                <button
                  type="button"
                  className="font-semibold hover:text-primary"
                  onClick={() => toggleSort("errors")}
                >
                  Errors{sortIndicator("errors")}
                </button>
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((run) => {
              const errors = runErrorCount(run);

              return (
                <tr key={run._id} className="hover">
                  <td className="text-xs text-base-content/70 whitespace-nowrap">
                    {new Date(run.startedAt).toLocaleString()}
                    {run.type === "manual" && (
                      <span className="badge badge-ghost badge-xs ml-1">manual</span>
                    )}
                  </td>
                  <td className="font-medium">
                    {retailerName(run.retailerSlug)}
                  </td>
                  <td>
                    <span
                      className={`badge badge-xs ${STATUS_BADGE[run.status] ?? ""}`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="text-xs">
                    {formatDuration(run.startedAt, run.finishedAt)}
                  </td>
                  <td className="text-xs">
                    {run.itemsScraped}
                    {hasProductChangeStats(run) && (
                      <span className="text-base-content/40 ml-1">
                        ({run.productsAdded ?? 0} added · {run.productsUpdated ?? 0}{" "}
                        updated)
                      </span>
                    )}
                  </td>
                  <td>
                    {errors > 0 ? (
                      <span className="text-error text-xs">{errors}</span>
                    ) : (
                      <span className="text-base-content/30 text-xs">—</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/admin/scraper-logs/${run._id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && search && (
        <p className="text-sm text-base-content/50 text-center py-4">
          No runs match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
