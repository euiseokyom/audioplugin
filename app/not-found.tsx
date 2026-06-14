import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
      <p className="text-sm font-semibold text-primary tracking-wide uppercase">
        PluginBargains
      </p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-base-content/60 text-sm">
        This page doesn&apos;t exist or may have been moved. Try searching for a
        plugin instead.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
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
