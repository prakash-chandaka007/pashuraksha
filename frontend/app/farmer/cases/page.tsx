import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getHealthCasesByFarmer } from "@/lib/services/cases";
import { getFarmerProfile } from "@/lib/services/farmer";

export default async function FarmerCasesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  let cases = [];
  let farmerId = "";
  try {
    const farmer = await getFarmerProfile(session.user.id);
    farmerId = farmer.farmerId;
    
    const rawCases = await getHealthCasesByFarmer(session.user.id);
    // Format dates and relations for client component serialization
    cases = rawCases.map((c) => ({
      id: c.id,
      caseId: c.caseId,
      symptoms: c.symptoms,
      symptomStartDate: c.symptomStartDate ? c.symptomStartDate.toLocaleDateString() : "N/A",
      location: c.location || "N/A",
      status: c.status,
      createdAt: c.createdAt.toLocaleDateString(),
      aiAnalysis: c.aiAnalysis ? true : false,
      vetAssessmentsCount: c.vetAssessments.length,
      assignedVetName: c.assignedVet ? c.assignedVet.name : null,
    }));
  } catch (err) {
    console.error("Failed to load farmer cases:", err);
    redirect("/farmer/profile");
  }

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "AI_ANALYZED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "VET_ASSESSED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
      {/* Header section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            My Reported Cases
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            Monitor the diagnostic progress, AI triage analyses, and veterinary prescriptions for your livestock.
          </p>
        </div>
        <Link
          href="/farmer/cases/new"
          className="px-5 py-2.5 rounded-lg font-bold bg-indigo-650 hover:bg-indigo-750 text-white shadow-sm hover:shadow transition duration-200 active:scale-98"
        >
          Report Health Issue
        </Link>
      </div>

      {/* Prominent Farmer ID Display Banner */}
      {farmerId && (
        <div className="mb-8 p-4 rounded-lg bg-indigo-50 border border-indigo-150 text-slate-800 text-sm font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-slate-500 font-medium">Farmer Profile ID: </span>
            <span className="font-mono text-base font-bold text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded ml-1.5 shadow-sm">
              {farmerId}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Use this Farmer ID or your registered Mobile Number to log in.
          </span>
        </div>
      )}

      {cases.length === 0 ? (
        // Empty state block
        <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white max-w-lg mx-auto flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-800">No Cases Reported Yet</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-[280px]">
            If one of your animals exhibits symptoms, report a case immediately to trigger triage.
          </p>
          <Link
            href="/farmer/cases/new"
            className="mt-6 px-4 py-2 rounded-lg text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
          >
            Report Your First Case
          </Link>
        </div>
      ) : (
        // Cases Grid List
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow transition duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Case Reference
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-800">{c.caseId}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(c.status)}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-slate-650 text-sm font-medium line-clamp-3 mb-6 bg-slate-50 p-3 rounded-lg italic">
                  &ldquo;{c.symptoms}&rdquo;
                </p>

                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-4 mb-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
                      Reported On
                    </span>
                    <span className="text-slate-700">{c.createdAt}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
                      Assigned Doctor
                    </span>
                    <span className="text-indigo-650 font-bold">
                      {c.assignedVetName || "Assigning Doctor..."}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
                      AI Triage Status
                    </span>
                    <span className={c.aiAnalysis ? "text-indigo-600 font-bold" : "text-slate-400"}>
                      {c.aiAnalysis ? "Analysis Ready" : "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">
                      Vet Assessments
                    </span>
                    <span className={c.vetAssessmentsCount > 0 ? "text-indigo-600 font-bold" : "text-slate-400"}>
                      {c.vetAssessmentsCount > 0 ? `${c.vetAssessmentsCount} Logged` : "Waiting for Vet"}
                    </span>
                  </div>
                </div>

                {/* Status Acknowledgement Notice */}
                <div className="mb-6 p-3 bg-slate-50 border border-slate-150 rounded-lg text-slate-650 text-xs font-medium">
                  <span className="text-slate-450 uppercase text-[9px] block font-bold tracking-wider mb-0.5">Acknowledgment</span>
                  {c.status === "PENDING" && "Report received, analyzing details..."}
                  {(c.status === "AI_ANALYZED" || c.status === "VET_ASSIGNED") && "AI analysis completed. Assigned to veterinary doctor."}
                  {c.status === "VET_ASSESSED" && "Doctor has diagnosed & prescribed cure plan."}
                  {c.status === "RESOLVED" && "Case is successfully cured & resolved."}
                </div>
              </div>

              <Link
                href={`/farmer/cases/${c.caseId}`}
                className="w-full text-center py-2.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-slate-700 transition"
              >
                View Diagnostic Details & Cure &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
