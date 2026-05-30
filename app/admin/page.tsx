import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import ScraperLog from "@/models/ScraperLog";
import Product from "@/models/Product";
import type { IScraperLog } from "@/types";
import { RETAILERS } from "@/lib/retailers";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  success: "badge-success",
  failed: "badge-error",
  partial: "badge-warning",
  running: "badge-info",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");

  await connectDB();

  const [logs, productCount, priceEntryCount] = await Promise.all([
    ScraperLog.find({}).sort({ startedAt: -1 }).limit(50).lean() as unknown as Promise<IScraperLog[]>,
    Product.countDocuments(),
    import("@/models/PriceEntry").then((m) => m.default.countDocuments()),
  ]);

  const recentProducts = await Product.find({}).sort({ createdAt: -1 }).limit(10).lean();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-base-content/50 text-sm mt-1">
          Manage products, monitor scrapers, and trigger manual jobs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Products", value: productCount, icon: "🎹" },
          { label: "Price Entries", value: priceEntryCount, icon: "💰" },
          { label: "Retailers Tracked", value: RETAILERS.length, icon: "🏪" },
          { label: "Scraper Logs", value: logs.length, icon: "📋" },
        ].map((stat) => (
          <div key={stat.label} className="bg-base-200 border border-base-300 rounded-xl p-4">
            <p className="text-2xl mb-1">{stat.icon}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-base-content/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Scraper Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Scraper Logs</h2>
          <form
            action="/api/admin/scraper-logs"
            method="POST"
            className="flex gap-2 items-center"
          >
            <select name="retailerSlug" className="select select-sm bg-base-200 border-base-300">
              <option value="">All retailers</option>
              {RETAILERS.map((r) => (
                <option key={r.slug} value={r.slug}>{r.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-sm btn-primary">
              Trigger Scrape
            </button>
          </form>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-base-content/40 bg-base-200 rounded-xl border border-base-300">
            <p className="text-3xl mb-2">📋</p>
            <p>No scraper logs yet. Phase 2 feature.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-300">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200">
                  <th>Retailer</th>
                  <th>Started</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Errors</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const duration = log.finishedAt
                    ? Math.round(
                        (new Date(log.finishedAt).getTime() - new Date(log.startedAt).getTime()) /
                          1000
                      )
                    : null;
                  return (
                    <tr key={log._id} className="hover">
                      <td className="font-medium">{log.retailerSlug}</td>
                      <td className="text-xs text-base-content/50">
                        {new Date(log.startedAt).toLocaleString()}
                      </td>
                      <td className="text-xs">{duration != null ? `${duration}s` : "—"}</td>
                      <td>
                        <span className={`badge badge-xs ${STATUS_BADGE[log.status] ?? ""}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{log.itemsScraped}</td>
                      <td>
                        {log.failedUrls?.length > 0 ? (
                          <span className="text-error text-xs">{log.failedUrls.length} failed</span>
                        ) : (
                          <span className="text-base-content/30 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Products */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Recent Products</h2>
        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table table-sm w-full">
            <thead>
              <tr className="bg-base-200">
                <th>Name</th>
                <th>Manufacturer</th>
                <th>Category</th>
                <th>List Price</th>
                <th>Sales Count</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((p) => (
                <tr key={p._id.toString()} className="hover">
                  <td>
                    <a
                      href={`/products/${p.slug}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {p.name}
                    </a>
                  </td>
                  <td className="text-sm text-base-content/60">{p.manufacturer}</td>
                  <td>
                    <span className="badge badge-ghost badge-xs">{p.category}</span>
                  </td>
                  <td>${p.registeredPrice}</td>
                  <td>{p.salesCount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
