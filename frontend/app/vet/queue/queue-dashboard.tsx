"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HealthCase {
  id: string;
  caseId: string;
  symptoms: string;
  symptomStartDate: Date | string;
  location: string | null;
  status: string;
  createdAt: Date | string;
  images: string[];
  farmer: {
    name: string;
    phone: string;
    district: string;
    state: string;
  };
  aIAnalysis: {
    predictedDiseases: Array<{
      disease: string;
      confidence: number;
      urgency: string;
    }>;
    disclaimer: string;
  } | null;
  vetAssessments: Array<{
    id: string;
    diagnosis: string;
    severity: string;
    treatmentPlan: string;
    notes?: string | null;
    assessedAt: Date | string;
  }>;
}

interface QueueDashboardProps {
  vetUserId: string;
  vetRegion: string;
  initialCases: HealthCase[];
}

export default function QueueDashboard({ vetUserId, vetRegion, initialCases }: QueueDashboardProps) {
  const router = useRouter();
  const [cases, setCases] = useState<HealthCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<HealthCase | null>(null);

  // Form State for Assessment
  const [diagnosis, setDiagnosis] = useState("");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter State
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [assignmentFilter, setAssignmentFilter] = useState<"ASSIGNED" | "ALL">("ASSIGNED");

  const filteredCases = cases.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    if (assignmentFilter === "ASSIGNED" && c.assignedVetId !== vetUserId) return false;
    return true;
  });

  const handleOpenCase = (c: HealthCase) => {
    setSelectedCase(c);
    setError(null);
    setSuccess(null);

    // If assessment already exists, prefill it for editing or viewing
    const existing = c.vetAssessments[0];
    setDiagnosis(existing?.diagnosis || "");
    setSeverity((existing?.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") || "MEDIUM");
    setTreatmentPlan(existing?.treatmentPlan || "");
    setNotes(existing?.notes || "");
  };

  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/cases/${selectedCase.id}/assessment`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Id": vetUserId,
        },
        credentials: "include",
        body: JSON.stringify({
          diagnosis,
          severity,
          treatmentPlan,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit veterinary assessment.");
      }

      const newAssessment = data.assessment;

      // Update local case state
      setCases((prev) =>
        prev.map((c) => {
          if (c.id === selectedCase.id) {
            return {
              ...c,
              status: "VET_ASSESSED",
              vetAssessments: [newAssessment],
            };
          }
          return c;
        })
      );

      setSuccess("Clinical assessment recorded successfully!");
      setSelectedCase(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Veterinarian Triage Queue
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor active disease alerts, review preliminary AI triages, and record clinical assessments.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: "ASSIGNED", label: "Assigned to Me" },
              { id: "ALL", label: "All Regional Cases" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setAssignmentFilter(tab.id as "ASSIGNED" | "ALL")}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  assignmentFilter === tab.id
                    ? "bg-white text-indigo-600 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {["ALL", "AI_ANALYZED", "VET_ASSESSED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                  statusFilter === status
                    ? "bg-white text-indigo-600 shadow-sm font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {status === "ALL" ? "All Statuses" : status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Veterinarian Region Jurisdiction Banner */}
      {vetRegion && (
        <div className="mb-8 p-4 rounded-lg bg-indigo-50 border border-indigo-150 text-slate-800 text-sm font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-slate-500 font-medium">Your Assigned AP Jurisdiction: </span>
            <span className="font-bold text-slate-900 ml-1 bg-white border border-slate-200 px-3 py-1 rounded shadow-sm">
              {vetRegion}
            </span>
          </div>
          <span className="text-xs text-indigo-600 font-medium">
            Assigned cases route directly to your queue.
          </span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm">
          Success: {success}
        </div>
      )}

      {/* Queue List Grid */}
      {filteredCases.length === 0 ? (
        <div className="p-12 border border-slate-200 rounded-xl bg-white shadow-sm text-center py-20 text-slate-400">
          <h3 className="text-lg font-bold text-slate-700">
            Queue is Empty
          </h3>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            No active cases are currently waiting in the queue. New reported cases automatically populate here after preliminary AI triage.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((c) => {
            const dateStr = new Date(c.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const severityLabel = c.vetAssessments[0]?.severity || c.aIAnalysis?.predictedDiseases[0]?.urgency || "MEDIUM";

            return (
              <div
                key={c.id}
                onClick={() => handleOpenCase(c)}
                className="group p-6 rounded-2xl border border-slate-150 bg-white shadow-sm hover:shadow-md transition duration-300 dark:bg-slate-900 dark:border-slate-800 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <span className="text-[10px] font-bold font-mono tracking-tight text-slate-400">
                      {c.caseId}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                        severityLabel === "CRITICAL" || severityLabel === "HIGH"
                          ? "bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400"
                          : "bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-400"
                      }`}
                    >
                      {severityLabel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-2 mb-4">
                    {c.symptoms}
                  </h3>

                  <div className="space-y-2 border-t border-slate-50 dark:border-slate-800 pt-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between">
                      <span>Farmer</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.farmer.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {c.location || c.farmer.district}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date Reported</span>
                      <span>{dateStr}</span>
                    </div>
                    {c.assignedVetId ? (
                      <div className="flex justify-between mt-1.5 text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 font-bold">
                        <span>Regional Assignment</span>
                        <span>Active</span>
                      </div>
                    ) : (
                      <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        <span>Jurisdiction</span>
                        <span>General Queue</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-3 flex justify-between items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400 border-t border-slate-50 dark:border-slate-800 group-hover:translate-x-1 transition duration-300">
                  <span>
                    {c.status === "VET_ASSESSED" ? "View Assessment" : "Triage Case"}
                  </span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Case Details & Assessment Slide-over Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full overflow-y-auto p-6 md:p-8 shadow-2xl flex flex-col justify-between animate-slide-in">
            <div>
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="text-[10px] font-bold font-mono text-slate-450">
                    Triaging Case {selectedCase.caseId}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                    Reported by {selectedCase.farmer.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-2xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  &times;
                </button>
              </div>

              {/* Symptoms & Attachments */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Symptoms & History
                </h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl">
                  {selectedCase.symptoms}
                </p>
                <div className="text-[10px] text-slate-400 mt-2">
                  Observed on: {new Date(selectedCase.symptomStartDate).toLocaleDateString("en-IN")}
                </div>

                {/* Symptom Images Grid */}
                {selectedCase.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {selectedCase.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Symptom photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AI preliminary analysis summary */}
              {selectedCase.aIAnalysis && (
                <div className="mb-8 p-4 rounded-xl border border-emerald-500/10 bg-emerald-50/20 dark:bg-emerald-950/5">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">
                    AI Preliminary Diagnostic Support
                  </div>
                  <div className="space-y-3">
                    {selectedCase.aIAnalysis.predictedDiseases.map((pred, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {pred.disease} (Urgency: {pred.urgency})
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {Math.round(pred.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Log/Review Clinical Assessment */}
              <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">
                  {selectedCase.status === "VET_ASSESSED" ? "Registered Diagnosis" : "Log Clinical Verification"}
                </h3>

                <form onSubmit={handleSaveAssessment} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Clinical Diagnosis
                    </label>
                    <input
                      type="text"
                      required
                      disabled={selectedCase.status === "VET_ASSESSED"}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Foot-and-Mouth Disease (FMD) confirmed"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-transparent text-slate-800 transition dark:border-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Severity Category
                      </label>
                      <select
                        disabled={selectedCase.status === "VET_ASSESSED"}
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL")}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-transparent text-slate-800 transition dark:border-slate-800 dark:text-slate-150 dark:focus:ring-indigo-500/10"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Clinical Treatment Plan
                    </label>
                    <textarea
                      required
                      disabled={selectedCase.status === "VET_ASSESSED"}
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      placeholder="e.g. Quarantine affected flock immediately. Wash wounds with 1% potassium permanganate solution. Keep barn flooring disinfected."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-transparent text-slate-800 transition dark:border-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Private Notes (Optional)
                    </label>
                    <textarea
                      disabled={selectedCase.status === "VET_ASSESSED"}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. High risk of spreading due to close grazing boundaries."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-transparent text-slate-800 transition dark:border-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/10"
                    />
                  </div>

                  {selectedCase.status !== "VET_ASSESSED" && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98"
                    >
                      {loading ? "Recording Assessment..." : "Commit Clinical Assessment"}
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
