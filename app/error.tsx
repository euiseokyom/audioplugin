"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
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
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
      <p className="text-sm font-semibold text-primary tracking-wide uppercase">
        PluginBargains
      </p>
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-base-content/60 text-sm">
        We hit an unexpected error loading this page. Try again, or head back to
        the homepage.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Try again
        </button>
        <Link
          href="/"
          className="btn btn-sm bg-white text-base-content hover:bg-base-200"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
