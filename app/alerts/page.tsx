import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PAGE_CONTAINER } from "@/lib/layout";
import { absoluteUrl } from "@/lib/site-url";
import { getUserAlertsWithProducts } from "@/services/alerts";
import EmptyState from "@/components/EmptyState";
import AlertProductSection from "@/components/AlertProductSection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Alerts",
  description: "View and manage your plugin price drop alerts.",
  alternates: { canonical: absoluteUrl("/alerts") },
};

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const alerts = await getUserAlertsWithProducts(session.user.id);

  return (
    <div className={`${PAGE_CONTAINER} py-12 lg:py-16`}>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6 lg:mb-8">
        My Alerts
      </h1>

      {alerts.length === 0 ? (
        <EmptyState icon="🔔" title="No alerts yet" />
      ) : (
        <div className="space-y-6">
          {alerts.map((alert) => (
            <AlertProductSection key={alert._id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
