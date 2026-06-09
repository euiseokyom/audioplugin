import { formatTimeAgo } from "@/lib/format-time";
import { getRetailerName } from "@/services/admin/dashboard";
import type { SystemHealthSummary } from "@/types";

const STATUS_STYLES = {
  healthy: {
    alert: "alert-success",
    dot: "bg-success",
    label: "Healthy",
  },
  warning: {
    alert: "alert-warning",
    dot: "bg-warning",
    label: "Needs attention",
  },
  error: {
    alert: "alert-error",
    dot: "bg-error",
    label: "Issues detected",
  },
} as const;

interface SystemHealthBannerProps {
  health: SystemHealthSummary;
}

export default function SystemHealthBanner({ health }: SystemHealthBannerProps) {
  const styles = STATUS_STYLES[health.status];

  const lastRun = health.lastSuccessfulRun;
  const lastRunLabel = lastRun
    ? `${getRetailerName(lastRun.retailerSlug)} · ${formatTimeAgo(lastRun.finishedAt ?? lastRun.startedAt)}`
    : "None yet";

  return (
    <div className={`alert ${styles.alert} py-3`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styles.dot}`} />
          <span className="font-semibold text-sm">System Health: {styles.label}</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
          <span>
            Last success: <span className="font-medium">{lastRunLabel}</span>
          </span>
          <span>
            Recent issues (24h):{" "}
            <span className="font-medium">{health.recentFailureCount}</span>
          </span>
          {health.pendingJobCount > 0 && (
            <span>
              Pending manual jobs:{" "}
              <span className="font-medium">{health.pendingJobCount}</span>
            </span>
          )}
          {health.retailerErrorCount > 0 && (
            <span>
              Retailers in error:{" "}
              <span className="font-medium">{health.retailerErrorCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
