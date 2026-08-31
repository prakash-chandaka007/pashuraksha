import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCasesQueueForVet } from "@/lib/services/vet";
import { db } from "@/lib/services/db";
import QueueDashboard from "./queue-dashboard";

export default async function VetQueuePage() {
  const session = await auth();

  // Redirect to login if unauthorized
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Restrict to Vets
  if (session.user.role !== "vet") {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50/50">
        <h2 className="text-xl font-bold text-slate-800">
          Access Forbidden
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Access is restricted to registered veterinarians. Please log in with a veterinarian account.
        </p>
      </main>
    );
  }

  const rawCases = await getCasesQueueForVet(session.user.id);
  const vetUser = await db.user.findUnique({
    where: { id: session.user.id },
  });
  const vetRegion = vetUser?.vetRegion || "General Jurisdiction";

  // Safely serialize database model dates and relations for client component
  const cases = rawCases.map((c) => ({
    id: c.id,
    caseId: c.caseId,
    symptoms: c.symptoms,
    symptomStartDate: c.symptomStartDate?.toISOString() || new Date().toISOString(),
    location: c.location,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    images: c.images,
    assignedVetId: c.assignedVetId,
    species: c.species,
    affectedCount: c.affectedCount,
    farmer: {
      name: c.farmer.name,
      phone: c.farmer.phone || "",
      district: c.farmer.district || "",
      state: c.farmer.state || "",
    },
    aIAnalysis: c.aiAnalysis
      ? {
          predictedDiseases: c.aiAnalysis.predictedDiseases as { disease: string; confidence: number; urgency: string }[],
          disclaimer: c.aiAnalysis.disclaimer,
        }
      : null,
    vetAssessments: c.vetAssessments.map((v) => ({
      id: v.id,
      diagnosis: v.diagnosis,
      severity: v.severity,
      treatmentPlan: v.treatmentPlan,
      notes: v.notes,
      assessedAt: v.assessedAt.toISOString(),
    })),
  }));

  return (
    <main className="flex-1 bg-slate-50/50 py-10">
      <QueueDashboard vetUserId={session.user.id} vetRegion={vetRegion} initialCases={cases} />
    </main>
  );
}
