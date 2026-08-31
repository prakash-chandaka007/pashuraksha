import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSurveillanceMetrics, getRecentAlerts } from "@/lib/services/government";
import GovernmentDashboard from "./dashboard";

export default async function GovernmentDashboardPage() {
  const session = await auth();

  // Redirect to login if unauthorized
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Restrict to Gov
  if (session.user.role !== "gov") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">
          Access Forbidden
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Access is restricted to authorized government officials. Please log in with a government account.
        </p>
      </main>
    );
  }

  const metrics = await getSurveillanceMetrics(session.user.id);
  const rawAlerts = await getRecentAlerts(session.user.id);

  // Safely serialize database model dates and relations for client component
  const alerts = rawAlerts.map((a) => ({
    id: a.id,
    district: a.district,
    type: a.type,
    message: a.message,
    timestamp: a.timestamp.toISOString(),
  }));

  return (
    <main className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 py-10">
      <GovernmentDashboard metrics={metrics} alerts={alerts} />
    </main>
  );
}
