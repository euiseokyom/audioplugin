"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatTimeAgo } from "@/lib/format-time";
import type { RetailerDashboardEntry } from "@/types";

const HEALTH_STYLES: Record<
  RetailerDashboardEntry["health"],
  { dot: string; badge: string; label: string }
> = {
  healthy: {
    dot: "bg-success",
    badge: "badge-success",
    label: "Healthy",
  },
  warning: {
    dot: "bg-warning",
    badge: "badge-warning",
    label: "Warning",
  },
  error: {
    dot: "bg-error",
    badge: "badge-error",
    label: "Error",
  },
};

interface RetailersGridProps {
  retailers: RetailerDashboardEntry[];
}

export default function RetailersGrid({ retailers }: RetailersGridProps) {
  const router = useRouter();
  const [triggering, setTriggering] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hideInactive, setHideInactive] = useState(true);

  const activeCount = useMemo(
    () => retailers.filter((r) => r.isActive).length,
    [retailers]
  );

  const visibleRetailers = useMemo(
    () => (hideInactive ? retailers.filter((r) => r.isActive) : retailers),
    [retailers, hideInactive]
  );

  async function triggerScrape(slug: string) {
    setTriggering(slug);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/scraper-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retailerSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to trigger scrape");
        return;
      }
      setMessage(`Queued manual scrape for ${slug}. Refresh to see it.`);
      router.refresh();
    } catch {
      setMessage("Failed to trigger scrape");
    } finally {
      setTriggering(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-base-content/50">
          Showing {visibleRetailers.length} of {retailers.length} retailers
          {hideInactive && activeCount < retailers.length && (
            <span> ({activeCount} active)</span>
          )}
        </p>
        <label className="label cursor-pointer gap-2 justify-start sm:justify-end py-0">
          <input
            type="checkbox"
            className="toggle toggle-sm toggle-primary"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
          />
          <span className="label-text text-sm">Hide inactive retailers</span>
        </label>
      </div>

      {visibleRetailers.length === 0 ? (
        <div className="text-center py-10 text-base-content/40 bg-base-200 rounded-xl border border-base-300">
          <p className="text-sm">No active retailers to show.</p>
          <p className="text-xs mt-1">
            Turn off &ldquo;Hide inactive retailers&rdquo; to see all configured
            retailers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRetailers.map((retailer) => {
            const styles = HEALTH_STYLES[retailer.health];
            const isTriggering = triggering === retailer.slug;
            const hasPending = retailer.hasPendingJob ?? false;

            return (
              <div
                key={retailer.slug}
                className="bg-base-200 border border-base-300 rounded-xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${styles.dot}`}
                      title={styles.label}
                    />
                    <h3 className="font-semibold truncate">{retailer.name}</h3>
                    {hasPending && (
                      <span className="badge badge-warning badge-xs shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                  <span className={`badge badge-xs ${styles.badge}`}>
                    {styles.label}
                  </span>
                </div>

                <dl className="text-xs space-y-1 text-base-content/60">
                  <div className="flex justify-between gap-2">
                    <dt>Last success</dt>
                    <dd className="text-base-content/80">
                      {retailer.lastSuccessAt
                        ? formatTimeAgo(retailer.lastSuccessAt)
                        : "Never"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Products tracked</dt>
                    <dd className="text-base-content/80">
                      {retailer.productCount.toLocaleString()}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => triggerScrape(retailer.slug)}
                  disabled={isTriggering || hasPending}
                  className="btn btn-sm btn-outline mt-auto"
                  title={
                    hasPending
                      ? "A manual scrape is already queued for this retailer"
                      : undefined
                  }
                >
                  {isTriggering ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : hasPending ? (
                    "Queued"
                  ) : (
                    "Trigger Scrape"
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-base-content/40">
        Manual triggers create a pending job processed by the worker on the next
        cycle.
      </p>

      {message && (
        <div className="alert alert-info text-sm py-2">
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
