import { connectDB } from "@/lib/db";
import { formatTimeAgo } from "@/lib/format-time";
import {
  deriveSystemHealth,
  getDashboardData,
  getRetailerName,
} from "@/services/admin/dashboard";
import DashboardRefreshBar from "@/components/admin/DashboardRefreshBar";
import SystemHealthBanner from "@/components/admin/SystemHealthBanner";
import ScraperRunsTable from "@/components/admin/ScraperRunsTable";
import RetailersGrid from "@/components/admin/RetailersGrid";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await connectDB();
  const dashboardData = await getDashboardData();
  const { stats, recentRuns, retailers, fetchedAt } = dashboardData;
  const systemHealth = deriveSystemHealth(dashboardData);

  const lastRun = stats.lastSuccessfulRun;
  const lastRunLabel = lastRun
    ? `${getRetailerName(lastRun.retailerSlug)} · ${formatTimeAgo(lastRun.finishedAt ?? lastRun.startedAt)}`
    : "None yet";

  const errorCount = retailers.filter((r) => r.health === "error").length;

  return (
    <>
      <DashboardRefreshBar fetchedAt={fetchedAt} />

      <SystemHealthBanner health={systemHealth} />

      {errorCount > 0 && (
        <div className="alert alert-warning text-sm py-3">
          <span>
            {errorCount} retailer{errorCount === 1 ? "" : "s"} need attention
            (failed or never scraped).
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Products"
          value={stats.totalProducts.toLocaleString()}
        />
        <StatCard
          label="Active Retailers"
          value={stats.activeRetailers.toLocaleString()}
          sub="with products or scrape activity"
        />
        <StatCard label="Last Successful Run" value={lastRunLabel} isText />
        <StatCard
          label="Last 24 Hours"
          value={`${stats.productsAdded24h} added · ${stats.productsUpdated24h} updated`}
          isText
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Scrape Runs</h2>
        <ScraperRunsTable runs={recentRuns} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Retailers</h2>
        <RetailersGrid retailers={retailers} />
      </section>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  isText,
}: {
  label: string;
  value: string;
  sub?: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-base-200 border border-base-300 rounded-xl p-4">
      <p
        className={`font-bold ${isText ? "text-sm leading-snug" : "text-2xl"}`}
      >
        {value}
      </p>
      <p className="text-xs text-base-content/50 mt-1">{label}</p>
      {sub && <p className="text-xs text-base-content/40 mt-0.5">{sub}</p>}
    </div>
  );
}
