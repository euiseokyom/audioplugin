import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-base-content/50 text-sm mt-1">
            Monitor scraper health and trigger manual jobs.
          </p>
        </div>
        <Link href="/" className="btn btn-ghost btn-sm shrink-0">
          ← Back to site
        </Link>
      </div>
      {children}
    </div>
  );
}
