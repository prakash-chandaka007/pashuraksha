import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getHealthCaseDetails } from "@/lib/services/cases";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FarmerCaseDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  let detail = null;
  try {
    detail = await getHealthCaseDetails(session.user.id, id);
  } catch (err) {
    console.error("Failed to load case details:", err);
    redirect("/farmer/cases");
  }

  if (!detail) {
    return (
      <div className="w-full max-w-3xl mx-auto p-8 text-center bg-white border border-slate-200 rounded-xl shadow-sm mt-10">
        <h2 className="text-xl font-bold text-slate-800">Case Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          The requested case could not be located or you do not have permission to view it.
        </p>
        <Link
          href="/farmer/cases"
          className="mt-6 inline-block px-4 py-2 rounded-lg text-xs font-bold bg-indigo-650 hover:bg-indigo-755 text-white transition"
        >
          &larr; Back to Cases
        </Link>
      </div>
    );
  }

  // Formatting helpers
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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency?.toUpperCase()) {
      case "HIGH":
        return "bg-red-50 text-red-700 border-red-200";
      case "MEDIUM":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Safe cast for predicted diseases type
  const predictedDiseases = (detail.aiAnalysis?.predictedDiseases || []) as {
    disease: string;
    confidence: number;
    urgency: string;
  }[];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/farmer/cases"
          className="inline-flex items-center text-xs font-bold text-indigo-650 hover:underline mb-4"
        >
          &larr; Back to My Cases
        </Link>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl md:text-2xl font-extrabold text-slate-900">
                {detail.caseId}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(detail.status)}`}>
                {detail.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Reported on {detail.createdAt.toLocaleDateString()} &bull; Location: {detail.location}
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Veterinarian Banner */}
      {detail.assignedVet && (
        <div className="mb-8 p-4 rounded-lg bg-indigo-50 border border-indigo-150 text-slate-800 text-sm font-semibold flex justify-between items-center shadow-sm">
          <div>
            <span className="text-slate-500 font-medium">Assigned Veterinarian: </span>
            <span className="font-bold text-slate-900 ml-1">
              {detail.assignedVet.name} ({detail.assignedVet.email})
            </span>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase font-bold">
            Assigned
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Case Inputs & Symptoms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Symptoms Report */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              Reported Health Symptoms
            </h2>
            
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                Farmer Observations
              </div>
              <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                &ldquo;{detail.symptoms}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-slate-400 block mb-0.5">Affected Species</span>
                <span className="text-slate-800 text-sm">{detail.species}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Approx. Affected Headcount</span>
                <span className="text-slate-800 text-sm">{detail.affectedCount} animals</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Onset of Symptoms</span>
                <span className="text-slate-800 text-sm">
                  {detail.symptomStartDate?.toLocaleDateString() || "N/A"}
                </span>
              </div>
            </div>

            {/* Render case media attachments if present */}
            {detail.images && detail.images.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Uploaded Case Photos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detail.images.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:border-indigo-400 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Livestock attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <span className="absolute bottom-2 right-2 bg-slate-900/60 text-[9px] font-bold text-white px-2 py-0.5 rounded-full">
                        View Full
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Veterinary Prescriptions & Cure instructions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              Veterinary Diagnosis & Prescription
            </h2>

            {detail.vetAssessments.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-100 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center">
                <h3 className="text-sm font-bold text-slate-700">Awaiting Veterinarian Assessment</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
                  A medical professional will inspect this reported case, verify the diagnosis, and input prescription treatment plans shortly.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {detail.vetAssessments.map((vet) => (
                  <div key={vet.id} className="space-y-4">
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        <div className="text-sm font-bold text-slate-800">
                          Dr. {vet.vetUser?.name || "Registered Veterinarian"}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                          Email: {vet.vetUser?.email || "N/A"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400 block">
                          Assessed On
                        </span>
                        <span className="text-xs font-bold text-slate-750">
                          {vet.assessedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                          Clinical Diagnosis
                        </span>
                        <p className="text-sm font-bold text-slate-900">{vet.diagnosis}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold pt-2 border-t border-slate-150">
                        <div>
                          <span className="text-slate-500 block mb-0.5">Clinical Severity</span>
                          <span className="text-slate-800 text-sm font-bold">{vet.severity}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Prescribed Treatment & Cure Plan
                      </span>
                      <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-sm text-slate-700 leading-relaxed font-semibold whitespace-pre-line">
                        {vet.treatmentPlan}
                      </div>
                    </div>

                    {vet.notes && (
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Additional Veterinary Advice
                        </span>
                        <p className="text-xs text-slate-500 italic bg-amber-50/20 border border-amber-100/50 p-3 rounded-lg">
                          &ldquo;{vet.notes}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Triage Assistance */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 sticky top-6">
            <div>
              <h2 className="text-sm font-bold text-slate-850">
                AI Decision Support
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Preliminary triage classifications processed immediately upon symptom entry.
              </p>
            </div>

            {detail.aiAnalysis ? (
              <div className="space-y-6">
                
                {/* Predicted Conditions */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Possible Conditions
                  </span>
                  
                  <div className="space-y-3">
                    {predictedDiseases.map((pred, index) => (
                      <div
                        key={index}
                        className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-2"
                      >
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-800">{pred.disease}</span>
                          <span className="text-indigo-650 font-extrabold">{pred.confidence}%</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${pred.confidence}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] font-bold pt-1">
                          <span className="text-slate-400 uppercase">Urgency</span>
                          <span className={`px-1.5 py-0.5 rounded border uppercase ${getUrgencyBadge(pred.urgency)}`}>
                            {pred.urgency}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Warning Block */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-250 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-800">
                    Medical Triage Notice
                  </div>
                  <p className="text-[10px] text-amber-700 leading-relaxed font-semibold">
                    {detail.aiAnalysis.disclaimer || 
                      "AI-assisted preliminary assessments are provided as local decision support only and require veterinary clinical verification before administering treatments."
                    }
                  </p>
                </div>

              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 flex flex-col items-center justify-center">
                <p className="text-xs font-semibold">No AI Triage Logged</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  AI analysis could not be generated for this specific combination of inputs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
