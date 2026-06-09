"use client";

import { useEffect } from "react";

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
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-base-content/60 text-sm">
        We hit an unexpected error loading this page. Try again, or head back to
        the homepage.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary btn-sm">
          Try again
        </button>
        <a href="/" className="btn btn-ghost btn-sm">
          Go home
        </a>
      </div>
    </div>
  );
}
