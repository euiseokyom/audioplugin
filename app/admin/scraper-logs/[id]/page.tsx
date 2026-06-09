import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { formatDuration, formatTimeAgo } from "@/lib/format-time";
import { getScraperLogById, getRetailerName } from "@/services/admin/dashboard";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  success: "badge-success",
  failed: "badge-error",
  partial: "badge-warning",
  running: "badge-info",
  pending: "badge-ghost",
};

export default async function ScraperLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const log = await getScraperLogById(id);
  if (!log) notFound();

  const errorCount = log.failedUrls?.length ?? 0;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="btn btn-ghost btn-sm -ml-2">
        ← Back to dashboard
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold">
          {getRetailerName(log.retailerSlug)}
        </h2>
        <span className={`badge ${STATUS_BADGE[log.status] ?? ""}`}>
          {log.status}
        </span>
        {log.type && (
          <span className="badge badge-ghost badge-sm">{log.type}</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailItem label="Started" value={new Date(log.startedAt).toLocaleString()} />
        <DetailItem
          label="Finished"
          value={
            log.finishedAt
              ? new Date(log.finishedAt).toLocaleString()
              : "In progress"
          }
        />
        <DetailItem
          label="Duration"
          value={formatDuration(log.startedAt, log.finishedAt)}
        />
        <DetailItem label="Items scraped" value={String(log.itemsScraped)} />
        {log.productsAdded != null && (
          <DetailItem label="Products added" value={String(log.productsAdded)} />
        )}
        {log.productsUpdated != null && (
          <DetailItem
            label="Products updated"
            value={String(log.productsUpdated)}
          />
        )}
        <DetailItem label="Failed URLs" value={String(errorCount)} />
      </div>

      {log.errorMessage && (
        <div className="alert alert-error">
          <div>
            <p className="font-semibold text-sm">Error message</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{log.errorMessage}</p>
          </div>
        </div>
      )}

      {errorCount > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Failed URLs ({errorCount})</h3>
          <ul className="bg-base-200 border border-base-300 rounded-xl p-4 text-xs space-y-1 max-h-64 overflow-y-auto">
            {log.failedUrls.map((url) => (
              <li key={url} className="break-all text-base-content/70">
                {url}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(log.screenshotUrl || log.rawHtmlPath) && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Debug artifacts</h3>
          <div className="flex flex-wrap gap-3">
            {log.screenshotUrl && (
              <a
                href={log.screenshotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline"
              >
                View screenshot
              </a>
            )}
            {log.rawHtmlPath && (
              <span className="text-xs text-base-content/50 self-center">
                HTML: {log.rawHtmlPath}
              </span>
            )}
          </div>
          {log.screenshotUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={log.screenshotUrl}
              alt="Scrape debug screenshot"
              className="max-w-full rounded-xl border border-base-300 mt-2"
            />
          )}
        </div>
      )}

      <p className="text-xs text-base-content/40">
        Run ID: {log._id} · Started {formatTimeAgo(log.startedAt)}
      </p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-base-200 border border-base-300 rounded-xl p-4">
      <p className="text-xs text-base-content/50">{label}</p>
      <p className="font-medium text-sm mt-1">{value}</p>
    </div>
  );
}
