"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { formatTimeAgo } from "@/lib/format-time";

interface DashboardRefreshBarProps {
  fetchedAt: string;
}

export default function DashboardRefreshBar({ fetchedAt }: DashboardRefreshBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2 px-4 bg-base-200 border border-base-300 rounded-xl">
      <div className="text-sm text-base-content/60">
        <span>
          Last updated:{" "}
          <span className="text-base-content/80 font-medium">
            {formatTimeAgo(fetchedAt)}
          </span>
        </span>
        <span className="hidden sm:inline text-base-content/40 mx-2">·</span>
        <span className="block sm:inline text-xs text-base-content/40 mt-0.5 sm:mt-0">
          Data is loaded on page render. Click Refresh to fetch the latest.
        </span>
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="btn btn-sm btn-outline shrink-0"
      >
        {isPending ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          "Refresh"
        )}
      </button>
    </div>
  );
}
