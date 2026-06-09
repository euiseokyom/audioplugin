"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="bg-base-200 border border-base-300 rounded-xl p-8 text-center space-y-4">
      <h2 className="text-xl font-bold">Admin dashboard error</h2>
      <p className="text-base-content/60 text-sm">
        The dashboard failed to load. This may be a temporary database issue.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Retry
        </button>
        <Link href="/admin" className="btn btn-ghost btn-sm">
          Reload dashboard
        </Link>
      </div>
    </div>
  );
}
